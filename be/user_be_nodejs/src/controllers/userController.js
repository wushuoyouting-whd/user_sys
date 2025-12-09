const userService = require('../services/userService');
const { success, error } = require('../utils/ApiResponse');

exports.list = async (req, res, next) => {
    try {
        // const data = await userService.getUsers();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        // 查询条件
        const conditions = {};
        if (req.query.name) {
            conditions.name = req.query.name;
        }
        if (req.query.email) {
            conditions.email = req.query.email;
        }
        if (req.query.age) {
            conditions.age = parseInt(req.query.age);
        }
        if (req.query.startDate) {
            conditions.startDate = req.query.startDate;
        }
        if (req.query.endDate) {
            conditions.endDate = req.query.endDate;
        }

        const data = await userService.getUserWithPageAndCount(page, limit,conditions);
        res.json(success(data));
    } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
    try {
        const data = await userService.getUserById(+req.params.id);
        res.json(success(data));
    } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
    try {
        const data = await userService.createUser(req.body);
        res.status(200).json(success(data,'user created success'));
    } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
    try {
        const data = await userService.updateUser(+req.params.id, req.body);
        res.json(success(data,'user updated success'));
    } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
    try {
        const data = await userService.deleteUser(+req.params.id);
        res.json(success(data,'user deleted success'));
    } catch (e) { next(e); }
};