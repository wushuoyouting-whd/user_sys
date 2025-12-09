const AppDataSource = require('./src/config/db');
const app = require('./src/app');

(async () => {
    try {
        await AppDataSource.initialize();
        console.log('DB connected');

        const port = process.env.PORT || 3000;
        app.listen(port, () => console.log(`Server running on ${port}`));
    } catch (e) {
        console.error('Failed to start', e);
        process.exit(1);
    }
})();