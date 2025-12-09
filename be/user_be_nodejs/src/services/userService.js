const AppError = require('../utils/AppError');
const userRepo = require('../repositories/userRepository');


exports.getUsers = async () => userRepo.findAll();

exports.getUserById = async (id) => {
    const u = await userRepo.findById(id);
    if (!u) throw new AppError(404, 'User not found');
    return u;
};

exports.getUserWithPageAndCount = async (page,limit,conditions={}) => {
    return await userRepo.findWithPageAndCount(page,limit,conditions);
}

exports.createUser = async (dto) => {
    if (await userRepo.findByEmail(dto.email))
        throw new AppError(409, 'Email already exists');
    return userRepo.create(dto);
};

exports.updateUser = async (id, dto) => {
    const user = await userRepo.findById(id);
    if (!user) throw new AppError(404,'User not found');
    // 当前邮箱和新邮箱不一致时，才检查新邮箱是否在库中已存在
    if (dto.email && dto.email !== user.email) {
        if (await userRepo.findByEmail(dto.email))
            throw new AppError(409,'email already exists');
    }
    await userRepo.update(id, dto);
    return { ...user, ...dto };
};

exports.deleteUser = async (id) => {
    const { affected } = await userRepo.remove(id);
    if (!affected) throw new AppError(404,'User not found');
    console.log('deleted affected', affected)
};