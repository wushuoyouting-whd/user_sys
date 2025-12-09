const AppDataSource = require('./src/config/db');
const app = require('./src/app');

(async () => {
    try {
        // 初始化数据库连接
        await AppDataSource.initialize();
        console.log('DB connected');

        // 监听指定端口并启动 Express 应用
        const port = process.env.PORT;
        app.listen(port, () => console.log(`Server running on ${port}`));
    } catch (e) {
        console.error('Failed to start', e);
        process.exit(1);
    }
})();