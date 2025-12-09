const { DataSource } = require('typeorm');
const path = require('path');
require('dotenv').config()

const AppDataSource  = new DataSource({
    type: 'postgres',
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    username: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    synchronize: process.env.DB_SYNCHRONIZE, // 自动同步实体到数据库，改实体即改表（仅开发环境使用）
    entities: [path.join(__dirname, '../entities/**/*.{js,ts}')],       // 注册实体
    migrations: [path.join(__dirname, '../migrations/**/*.{js,ts}')],   // 迁移文件路径
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',    // 启动时自动迁移；如果修改entities中对象默认，重启后会自动更新数据表结构
    logging: process.env.DB_LOGGING === 'true',                 // 启用日志
    // uuidExtension: 'uuid-ossp',      // 生成 uuid_generate_v4() 等函数
});

module.exports = AppDataSource;