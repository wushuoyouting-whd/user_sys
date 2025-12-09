require('dotenv').config();
const express = require('express');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middlewares/errorHandler');
// swagger
const swaggerInstall = require('./swagger/index');

// 配置 Express 中间件
const app = express();
app.use(express.json());

// 注册路由 userRoutes
app.use('/api/users', userRoutes);


// 注册 Swagger - 放在路由之后
swaggerInstall(app);
// 添加全局错误处理器
app.use(errorHandler);

module.exports = app;