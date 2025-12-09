const AppDataSource = require('../config/db');
const User = require('../entities/User');
const {Like} = require("typeorm");

const repo = AppDataSource.getRepository(User);

exports.findAll = () => repo.find();
exports.findById = (id) => repo.findOneBy({ id });
exports.findByEmail = (email) => repo.findOneBy({ email });
exports.findWithPageAndCount = async (page=1, limit = 10 ,conditions = {}) => {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum ;

    let query = repo.createQueryBuilder();
    if (conditions.name) {
        query = query.andWhere('name like :name', { name: `%${conditions.name}%` });
    }
    if (conditions.email) {
        query = query.andWhere('email like :email', { email: `%${conditions.email}%` });
    }
    if (conditions.age) {
        query = query.andWhere('age = :age', { age: conditions.age });
    }
    if (conditions.startDate) {
        query = query.andWhere('birth_date >= :startDate', { startDate: conditions.startDate });
    }
    if (conditions.endDate) {
        query = query.andWhere('birth_date <= :endDate', { endDate: conditions.endDate });
    }

    const [data,total] = await query.skip(skip).take(limitNum).getManyAndCount();
    return {
        data,
        total,
        page,
        limit,
        totalPages : Math.ceil(total / limit)
    }
}
exports.findWithPageAndCount2 = async (page=1, limit = 10 ,conditions = {}) => {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum ;

    // 构建查询条件
    const where = {};
    if (conditions.name) {
        where.name = conditions.name;
    }
    if (conditions.email) {
        where.email = conditions.email;
    }
    if (conditions.age) {
        where.age = conditions.age;
    }
    // 时间范围查询
    if (conditions.startDate || conditions.endDate) {
        where.birthDate = {};
        if (conditions.startDate) {
            where.birthDate.$gte = new Date(conditions.startDate);
        }
        if (conditions.endDate) {
            where.birthDate.$lte = new Date(conditions.endDate);
        }
    }

    const [data, total] = await repo.findAndCount({
        where,
        skip,
        take : limitNum
    });
    return {
        data,
        total,
        page,
        limit,
        totalPages : Math.ceil(total / limit)
    }
};

exports.create = (user) => repo.save(repo.create(user));
exports.update = (id, user) => repo.update(id, user);
exports.remove = (id) => repo.delete(id);