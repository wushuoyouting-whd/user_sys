# 用户管理系统 - nodejs版后台
这是一个基于 Node.js 的后端服务项目，主要为用户提供系统服务支持。

## 技术栈
- 核心框架: Node.js ^16.0.0
- 包管理器: npm 或 yarn
- 主要依赖:
  - Web 应用框架 : express ^5.2.1
  - 数据库：PostgreSQl ^8.11.3
  - ORM ：typeorm ^0.3.11

## 项目结构
 ```
 src/
    ├── app.js              # 应用入口文件
    ├── routes/             # 路由定义
    ├── controllers/        # 控制器层（业务逻辑）
    ├── services/           # 服务层（数据处理）
    ├── repositories/       # 数据访问层
    ├── entities/           # 实体层（数据模型）
    ├── config/             # 配置文件目录
    │   └── db.js           # 数据库连接配置
    ├── middleware/         # 自定义中间件
    ├── utils/              # 工具函数
    └── app.js              # 应用入口文件
 └── server.js              # 启动服务
   ```

## 安装运行
1. 克隆项目仓库
2. 安装依赖: `npm install` 或 `yarn install`
3. 配置环境变量：比如数据库配置，开放端口等
4. 启动服务: `npm start` 或 `node server.js`