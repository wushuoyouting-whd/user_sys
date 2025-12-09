const fs = require('fs');
const path = require('path');

/**
 * 将 TypeORM Entity Schema 转换为 Swagger Schema
 * @param {EntitySchema} entitySchema - TypeORM Entity Schema
 * @returns {Object} Swagger schema 对象
 */
function entityToSwaggerSchema(entitySchema) {
    if (!entitySchema || !entitySchema.columns) {
        return {};
    }

    const schema = {
        type: 'object',
        required: [],
        properties: {}
    };

    const columns = entitySchema.columns || {};
    
    Object.keys(columns).forEach(key => {
        const column = columns[key];
        const type = column.type || 'varchar';
        let swaggerType = {};

        // 跳过自动生成的字段（如 id, createdAt, updatedAt）
        if (column.generated || column.createDate || column.updateDate) {
            return;
        }

        // 转换数据库类型到 Swagger 类型
        switch (type) {
            case 'int':
            case 'integer':
            case 'bigint':
                swaggerType = { type: 'integer' };
                break;
            case 'float':
            case 'double':
            case 'decimal':
            case 'numeric':
                swaggerType = { type: 'number' };
                break;
            case 'boolean':
                swaggerType = { type: 'boolean' };
                break;
            case 'date':
                swaggerType = { type: 'string', format: 'date' };
                break;
            case 'timestamptz':
            case 'timestamp':
            case 'datetime':
                swaggerType = { type: 'string', format: 'date-time' };
                break;
            default:
                swaggerType = { type: 'string' };
                if (column.length) {
                    swaggerType.maxLength = column.length;
                }
        }

        // 检查是否必填（没有 default 且不是 nullable）
        if (!column.default && !column.nullable && column.type !== 'boolean') {
            schema.required.push(key);
        }

        // 添加描述
        if (column.comment) {
            swaggerType.description = column.comment;
        }

        schema.properties[key] = swaggerType;
    });

    return schema;
}

/**
 * 自动扫描 entities 目录并生成所有 Swagger schemas
 * @returns {string} Swagger 注释字符串
 */
function generateSchemasFromEntities() {
    const entitiesPath = path.join(__dirname, '../entities');
    const files = fs.readdirSync(entitiesPath).filter(f => f.endsWith('.js'));
    
    console.log(`📂 扫描 entities 目录，找到 ${files.length} 个文件:`, files);
    
    let swaggerComment = '/**\n * @swagger\n * components:\n *   schemas:\n';

    files.forEach(file => {
        try {
            const entityPath = path.join(entitiesPath, file);
            
            // 直接读取文件内容并解析（更可靠）
            const fileContent = fs.readFileSync(entityPath, 'utf-8');
            
            // 提取 name
            const nameMatch = fileContent.match(/name:\s*['"]([^'"]+)['"]/);
            const entityName = nameMatch ? nameMatch[1] : file.replace('.js', '');
            
            // 提取整个配置对象：new EntitySchema({ ... })
            const configMatch = fileContent.match(/new\s+EntitySchema\s*\(\s*\{([\s\S]*?)\}\s*\)/);
            if (!configMatch) {
                console.warn(`⚠️  无法解析 Entity ${file} 的配置`);
                return;
            }
            
            const configStr = configMatch[1];
            const columns = {};
            
            // 提取 columns 对象内容
            // 匹配 columns: { ... }，需要处理嵌套的大括号
            const columnsStart = configStr.indexOf('columns:');
            if (columnsStart === -1) {
                console.warn(`⚠️  Entity ${file} 没有找到 columns 定义`);
                return;
            }
            
            // 找到 columns: 后面的内容
            let braceCount = 0;
            let startPos = -1;
            let endPos = -1;
            
            for (let i = columnsStart; i < configStr.length; i++) {
                if (configStr[i] === '{') {
                    if (startPos === -1) startPos = i + 1;
                    braceCount++;
                } else if (configStr[i] === '}') {
                    braceCount--;
                    if (braceCount === 0 && startPos !== -1) {
                        endPos = i;
                        break;
                    }
                }
            }
            
            if (startPos === -1 || endPos === -1) {
                console.warn(`⚠️  无法解析 Entity ${file} 的 columns`);
                return;
            }
            
            const columnsContent = configStr.substring(startPos, endPos);
            
            // 解析每个字段：fieldName: { ... }
            // 使用更简单的正则，匹配字段名和其配置
            const fieldRegex = /(\w+):\s*\{([^}]*?)\}/g;
            let fieldMatch;
            
            while ((fieldMatch = fieldRegex.exec(columnsContent)) !== null) {
                const fieldName = fieldMatch[1];
                const fieldConfig = fieldMatch[2];
                columns[fieldName] = {};
                
                // 提取 type
                const typeMatch = fieldConfig.match(/type:\s*['"]([^'"]+)['"]/);
                if (typeMatch) columns[fieldName].type = typeMatch[1];
                
                // 提取其他属性
                if (fieldConfig.includes('primary:') && fieldConfig.match(/primary:\s*true/)) {
                    columns[fieldName].primary = true;
                }
                if (fieldConfig.includes('generated:') && fieldConfig.match(/generated:\s*true/)) {
                    columns[fieldName].generated = true;
                }
                if (fieldConfig.includes('createDate:') && fieldConfig.match(/createDate:\s*true/)) {
                    columns[fieldName].createDate = true;
                }
                if (fieldConfig.includes('updateDate:') && fieldConfig.match(/updateDate:\s*true/)) {
                    columns[fieldName].updateDate = true;
                }
                if (fieldConfig.includes('nullable:') && fieldConfig.match(/nullable:\s*true/)) {
                    columns[fieldName].nullable = true;
                }
                
                // 提取 length
                const lengthMatch = fieldConfig.match(/length:\s*(\d+)/);
                if (lengthMatch) columns[fieldName].length = parseInt(lengthMatch[1]);
                
                // 提取 default（简单处理）
                if (fieldConfig.includes('default:')) {
                    const defaultNumMatch = fieldConfig.match(/default:\s*(\d+)/);
                    if (defaultNumMatch) {
                        columns[fieldName].default = parseInt(defaultNumMatch[1]);
                    } else if (fieldConfig.includes('default:') && !fieldConfig.includes('()')) {
                        columns[fieldName].default = true; // 有 default 但不是函数
                    }
                }
            }
            
            console.log(`📄 处理 Entity 文件: ${file}`);
            console.log(`   实体名称: ${entityName}`);
            console.log(`   columns 数量: ${columns ? Object.keys(columns).length : 0}`);
            
            if (!columns || Object.keys(columns).length === 0) {
                console.warn(`⚠️  Entity ${file} 没有 columns 定义`);
                return;
            }
            
            console.log(`✅ 开始生成 ${entityName} 和 ${entityName}Input schemas`);
            
            // 生成完整的 Entity schema（包含所有字段）
            swaggerComment += ` *     ${entityName}:\n`;
            swaggerComment += ` *       type: object\n`;
            
            const requiredFields = [];
            const properties = {};
            
            Object.keys(columns).forEach(key => {
                const column = columns[key];
                const type = column.type || 'varchar';
                let swaggerType = {};

                switch (type) {
                    case 'int':
                    case 'integer':
                    case 'bigint':
                        swaggerType = { type: 'integer' };
                        break;
                    case 'float':
                    case 'double':
                    case 'decimal':
                    case 'numeric':
                        swaggerType = { type: 'number' };
                        break;
                    case 'boolean':
                        swaggerType = { type: 'boolean' };
                        break;
                    case 'date':
                        swaggerType = { type: 'string', format: 'date' };
                        break;
                    case 'timestamptz':
                    case 'timestamp':
                    case 'datetime':
                        swaggerType = { type: 'string', format: 'date-time' };
                        break;
                    default:
                        swaggerType = { type: 'string' };
                        if (column.length) {
                            swaggerType.maxLength = column.length;
                        }
                }

                if (column.comment) {
                    swaggerType.description = column.comment;
                }

                // id 字段通常是必填的（在响应中）
                if (column.primary || (!column.default && !column.nullable && !column.generated && type !== 'boolean')) {
                    requiredFields.push(key);
                }

                properties[key] = swaggerType;
            });

            if (requiredFields.length > 0) {
                swaggerComment += ` *       required:\n`;
                requiredFields.forEach(field => {
                    swaggerComment += ` *         - ${field}\n`;
                });
            }
            
            swaggerComment += ` *       properties:\n`;
            Object.keys(properties).forEach(field => {
                const prop = properties[field];
                swaggerComment += ` *         ${field}:\n`;
                swaggerComment += ` *           type: ${prop.type}\n`;
                if (prop.format) {
                    swaggerComment += ` *           format: ${prop.format}\n`;
                }
                if (prop.maxLength) {
                    swaggerComment += ` *           maxLength: ${prop.maxLength}\n`;
                }
                if (prop.description) {
                    swaggerComment += ` *           description: ${prop.description}\n`;
                }
            });

            // 生成 Input schema（排除 id, createdAt, updatedAt）
            // 创建一个临时的 schema 对象用于生成 Input
            const tempSchema = { columns: columns };
            const inputSchema = entityToSwaggerSchema(tempSchema);
            
            console.log(`   生成 ${entityName}Input，字段数: ${Object.keys(inputSchema.properties || {}).length}`);
            
            swaggerComment += ` *     ${entityName}Input:\n`;
            swaggerComment += ` *       type: object\n`;
            if (inputSchema.required && inputSchema.required.length > 0) {
                swaggerComment += ` *       required:\n`;
                inputSchema.required.forEach(field => {
                    swaggerComment += ` *         - ${field}\n`;
                });
            }
            swaggerComment += ` *       properties:\n`;
            Object.keys(inputSchema.properties || {}).forEach(field => {
                const prop = inputSchema.properties[field];
                swaggerComment += ` *         ${field}:\n`;
                swaggerComment += ` *           type: ${prop.type}\n`;
                if (prop.format) {
                    swaggerComment += ` *           format: ${prop.format}\n`;
                }
                if (prop.maxLength) {
                    swaggerComment += ` *           maxLength: ${prop.maxLength}\n`;
                }
                if (prop.minimum !== undefined) {
                    swaggerComment += ` *           minimum: ${prop.minimum}\n`;
                }
                if (prop.maximum !== undefined) {
                    swaggerComment += ` *           maximum: ${prop.maximum}\n`;
                }
                if (prop.description) {
                    swaggerComment += ` *           description: ${prop.description}\n`;
                }
            });
        } catch (error) {
            console.warn(`⚠️  无法加载实体 ${file}:`, error.message);
            console.warn(error.stack);
        }
    });

    swaggerComment += ' */\n';
    return swaggerComment;
}

module.exports = {
    entityToSwaggerSchema,
    generateSchemasFromEntities
};

