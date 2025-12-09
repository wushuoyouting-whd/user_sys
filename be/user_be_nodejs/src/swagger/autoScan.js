const fs = require('fs');
const path = require('path');

/**
 * 自动扫描路由文件，解析 @Api 注解并生成 Swagger 文档
 * 类似 Java 的注解方式
 */

/**
 * 解析路由文件中的 @Api 注解
 * @param {string} filePath 文件路径
 * @param {string} basePath 路由基础路径（从 app.js 获取）
 * @returns {Array} API 定义数组
 */
function parseApiAnnotations(filePath, basePath = '/api') {
    const content = fs.readFileSync(filePath, 'utf-8');
    const apis = [];
    
    // 匹配 @ApiTag
    const tagMatch = content.match(/@ApiTag\(['"]([^'"]+)['"]\)/);
    const tag = tagMatch ? tagMatch[1] : 'Default';
    
    // 匹配所有 router.method 调用及其前面的 @Api 注释
    // 使用更精确的匹配：查找紧邻在 router.method 之前的 @Api 注释
    // 支持多行注释格式：/** ... @Api(...) ... */
    const routePattern = /\/\*\*[\s\S]*?@Api\(([^)]+)\)[\s\S]*?\*\/\s*\n\s*router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;
    let routeMatch;
    const routes = [];
    
    while ((routeMatch = routePattern.exec(content)) !== null) {
        const apiParams = routeMatch[1].trim();
        const method = routeMatch[2].toLowerCase();
        const route = routeMatch[3];
        
        // 解析 @Api 参数（支持中文字符和空格）
        const params = apiParams.split(',').map(p => p.trim().replace(/^['"]|['"]$/g, ''));
        const summary = params[0] || '';
        const entity = params[1] || '';
        const responseType = params[2] || 'single';
        
        routes.push({
            method,
            route,
            summary,
            entity,
            responseType
        });
    }
    
    // 转换为完整路径
    routes.forEach(route => {
        let fullPath = basePath + route.route;
        // 转换 :id 为 {id}
        fullPath = fullPath.replace(/:(\w+)/g, '{$1}');
        
        apis.push({
            method: route.method,
            path: fullPath,
            summary: route.summary,
            tag,
            entity: route.entity,
            responseType: route.responseType
        });
    });
    
    return apis;
}

/**
 * 从 app.js 中提取路由基础路径
 * @returns {Object} 路由映射 { routeName: basePath }
 */
function extractRoutesFromApp() {
    const appPath = path.join(__dirname, '../app.js');
    const content = fs.readFileSync(appPath, 'utf-8');
    const routes = {};
    
    // 匹配 app.use('/api/users', userRoutes)
    const pattern = /app\.use\(['"]([^'"]+)['"],\s*(\w+Routes)/g;
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
        const basePath = match[1];
        const routeName = match[2];
        routes[routeName] = basePath;
    }
    
    return routes;
}

/**
 * 从 API 定义生成 Swagger 注释
 */
function generateSwaggerDoc(api) {
    const { method, path, summary, tag, entity, responseType } = api;
    
    let doc = `/**
 * @swagger
 * ${path}:
 *   ${method}:`;

    doc += `
 *     summary: ${summary}
 *     tags: [${tag}]`;

    // 路径参数
    if (path.includes('{id}')) {
        const entityName = entity || tag.replace(/s$/, ''); // Users -> User
        doc += `
 *     parameters:
 *       - $ref: '#/components/parameters/${entityName}IdParam'`;
    }

    // 查询参数（GET 列表接口）
    if (method === 'get' && !path.includes('{id}')) {
        doc += `
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'`;
    }

    // 请求体
    if (['post', 'put', 'patch'].includes(method) && entity) {
        doc += `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/${entity}Input'`;
    }

    // 响应
    doc += `
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:`;

    if (responseType === 'empty') {
        doc += `
 *                       type: object
 *                       nullable: true`;
    } else if (responseType === 'list' && entity) {
        doc += `
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/${entity}'`;
    } else if (responseType === 'pagination' && entity) {
        doc += `
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/${entity}'
 *                         meta:
 *                           $ref: '#/components/schemas/PaginationMeta'`;
    } else if (entity) {
        doc += `
 *                       $ref: '#/components/schemas/${entity}'`;
    }

    // 错误响应
    if (path.includes('{id}')) {
        doc += `
 *       404:
 *         $ref: '#/components/responses/NotFound'`;
    }
    
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
        doc += `
 *       400:
 *         $ref: '#/components/responses/BadRequest'`;
    }

    doc += `
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */`;

    return doc;
}

/**
 * 自动扫描所有路由文件并生成 Swagger 文档
 */
function autoGenerateSwagger() {
    const routesPath = path.join(__dirname, '../routes');
    const appRoutes = extractRoutesFromApp();
    const files = fs.readdirSync(routesPath).filter(f => f.endsWith('.js') && !f.includes('.simple'));
    
    let allApis = [];
    
    files.forEach(file => {
        try {
            const filePath = path.join(routesPath, file);
            // 从文件名推断路由名称：userRoutes.js -> userRoutes
            const routeName = file.replace('.js', '');
            const basePath = appRoutes[routeName] || '/api';
            
            const apis = parseApiAnnotations(filePath, basePath);
            allApis = allApis.concat(apis);
        } catch (error) {
            console.warn(`⚠️  无法解析路由文件 ${file}:`, error.message);
        }
    });
    
    // 生成所有 API 的 Swagger 注释
    let swaggerDocs = '';
    allApis.forEach(api => {
        swaggerDocs += generateSwaggerDoc(api) + '\n\n';
    });
    
    return swaggerDocs;
}

module.exports = {
    parseApiAnnotations,
    generateSwaggerDoc,
    autoGenerateSwagger,
    extractRoutesFromApp
};
