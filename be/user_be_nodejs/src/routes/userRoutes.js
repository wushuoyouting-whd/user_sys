const router = require('express').Router();
const ctrl = require('../controllers/userController');
const validate = require('../middlewares/validate');
const Joi = require('joi');

// 定义传参校验规则
const createUpdateSchema = Joi.object({
    name: Joi.string().max(100).required(),
    age: Joi.number().integer().min(0).max(150),
    email: Joi.string().email().required(),
    birthDate: Joi.date().iso(),
});


router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(createUpdateSchema), ctrl.create);
router.put('/:id', validate(createUpdateSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;