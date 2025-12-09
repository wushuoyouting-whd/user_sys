const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');
const { autoGenerateSwagger } = require('./autoScan');
const { generateSchemasFromEntities } = require('./entityToSwagger');

/**
 * 自动生成完整的 Swagger 文档
 */
function generateSwaggerFile() {
    // 1. 从 Entity 生成 schemas
    const entitySchemasContent = generateSchemasFromEntities();
    
    // 直接提取 schemas 内容（去掉注释标记）
    // entitySchemasContent 格式：/**\n * @swagger\n * components:\n *   schemas:\n *     User:...\n */
    let entitySchemasOnly = '';
    
    // 使用正则表达式提取 schemas 部分
    // 匹配从 "schemas:" 到 " */" 之间的所有内容
    const match = entitySchemasContent.match(/\*\s*schemas:\s*\n([\s\S]*?)\s*\*\/\s*$/m);
    
    if (match && match[1]) {
        entitySchemasOnly = match[1];
        // 确保每行都有正确的注释标记
        if (!entitySchemasOnly.includes('*')) {
            // 如果提取的内容没有 * 标记，说明格式不对，尝试另一种方法
            const lines = entitySchemasOnly.split('\n');
            entitySchemasOnly = lines.map(line => {
                if (line.trim() && !line.trim().startsWith('*')) {
                    return ' *' + (line.startsWith(' ') ? '' : ' ') + line.trim();
                }
                return line;
            }).join('\n');
        }
    } else {
        // 备用方法：手动提取
        const lines = entitySchemasContent.split('\n');
        let startCollecting = false;
        const schemaLines = [];
        
        for (const line of lines) {
            if (line.includes('schemas:')) {
                startCollecting = true;
                continue;
            }
            
            if (startCollecting) {
                if (line.trim() === '*/' || line.trim() === ' */') {
                    break;
                }
                schemaLines.push(line);
            }
        }
        
        entitySchemasOnly = schemaLines.join('\n');
    }
    
    // 调试输出
    if (!entitySchemasOnly || entitySchemasOnly.trim().length < 10) {
        console.warn('⚠️  无法提取 Entity schemas');
        console.warn('Entity schemas content 长度:', entitySchemasContent.length);
        console.warn('Entity schemas content 前200字符:', entitySchemasContent.substring(0, 200));
    } else {
        console.log('✅ 成功提取 Entity schemas，长度:', entitySchemasOnly.length);
        if (entitySchemasOnly.includes('User:')) {
            console.log('✅ 确认包含 User schema');
        }
    }
    
    // 2. 从路由注解生成 API 文档
    const apiDocs = autoGenerateSwagger();
    
    // 3. 合并所有 schemas 到一个注释块中
    // 确保 entitySchemasOnly 有正确的格式（每行都有 * 标记）
    const allSchemas = `/**
 * @swagger
 * components:
 *   schemas:${entitySchemasOnly ? '\n' + entitySchemasOnly : ''}
 *     ApiResponse:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *           example: 0
 *         message:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           nullable: true
 *         traceId:
 *           type: string
 *           format: uuid
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *           example: 400
 *         message:
 *           type: string
 *           example: 请求参数错误
 *         data:
 *           type: object
 *           nullable: true
 *         traceId:
 *           type: string
 *           format: uuid
 *     
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         total:
 *           type: integer
 *           example: 100
 *         totalPages:
 *           type: integer
 *           example: 10
 */
`;

    // 4. 合并所有内容
    const fullContent = allSchemas + '\n' + apiDocs;
    
    // 5. 写入临时文件
    const tempPath = path.join(__dirname, 'swagger.auto.js');
    fs.writeFileSync(tempPath, fullContent);
    
    // 调试：检查生成的内容
    if (process.env.NODE_ENV !== 'production') {
        const hasUser = fullContent.includes('User:') || fullContent.includes('UserInput:');
        if (!hasUser) {
            console.warn('⚠️  警告：生成的 swagger.auto.js 中没有找到 User 或 UserInput schema');
            console.warn('Entity schemas 提取长度:', entitySchemasOnly.length);
            console.warn('Entity schemas 预览:', entitySchemasOnly.substring(0, 200));
        } else {
            console.log('✅ Entity schemas 已成功合并到 swagger.auto.js');
        }
    }
    
    return tempPath;
}

/**
 * Swagger 配置
 */
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'User System NodeJS API',
            version: '1.0.0',
            description: '用户管理系统-NodeJS后台 API 文档（自动生成）'
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: '开发环境'
            }
        ]
    },
    apis: [
        path.join(__dirname, 'swagger.auto.js'),
        path.join(__dirname, 'components.js')
    ]
};

// 生成文档
generateSwaggerFile();

const swaggerDocs = swaggerJsDoc(swaggerOptions);

/**
 * 返回 Swagger JSON
 */
const swaggerJson = function (req, res) {
    if (process.env.NODE_ENV !== 'production') {
        generateSwaggerFile();
        const freshDocs = swaggerJsDoc(swaggerOptions);
        res.setHeader('Content-Type', 'application/json');
        return res.send(freshDocs);
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocs);
};

/**
 * 安装 Swagger UI
 */
const swaggerInstall = function (app) {
    // 从 app.js 中获取路由信息
    const routesPath = path.join(__dirname, '../routes');
    const files = fs.readdirSync(routesPath).filter(f => f.endsWith('.js') && !f.includes('.simple'));
    
    // 重新生成文档（包含最新的路由信息）
    generateSwaggerFile();
    const freshDocs = swaggerJsDoc(swaggerOptions);
    
    app.get('/swagger.json', swaggerJson);
    
    app.use(
        '/swagger',
        swaggerUi.serve,
        swaggerUi.setup(freshDocs, {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'API 文档',
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true
            }
        })
    );
    
    console.log(`Swagger: http://localhost:${process.env.PORT || 3000}/swagger`);
    console.log(`已自动扫描 entities 和 routes，生成 Swagger 文档`);
    console.log(`使用 @Api("描述", "Entity", "响应类型") 注解即可自动生成文档`);
};

module.exports = swaggerInstall;
