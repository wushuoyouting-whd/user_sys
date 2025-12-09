const router = require('express').Router();
const ctrl = require('../controllers/userController');
const validate = require('../middlewares/validate');
const Joi = require('joi');

/**
 * @ApiTag("Users")
 */

const createUpdateSchema = Joi.object({
    name: Joi.string().max(100).required(),
    age: Joi.number().integer().min(0).max(150),
    email: Joi.string().email().required(),
    birthDate: Joi.date().iso(),
});

/**
 * @Api("获取用户列表", "User", "pagination")
 */
router.get('/', ctrl.list);

/**
 * @Api("获取用户详情", "User")
 */
router.get('/:id', ctrl.getById);

/**
 * @Api("创建用户", "User")
 */
router.post('/', validate(createUpdateSchema), ctrl.create);

/**
 * @Api("更新用户", "User")
 */
router.put('/:id', validate(createUpdateSchema), ctrl.update);

/**
 * @Api("删除用户", "User", "empty")
 */
router.delete('/:id', ctrl.remove);

module.exports = router;
