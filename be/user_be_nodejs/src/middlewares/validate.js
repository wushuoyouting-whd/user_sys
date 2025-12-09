/**
 * 校验req.body参数
 *  验证失败，调用next() 抛出错误，进入全局错误处理中间件
 *  验证成功，将验证结果挂载到req.body上
 * @param schema
 * @returns {(function(*, *, *): (*|undefined))|*}
 */
module.exports = (schema) => (req, _res, next) => {
    const { error } = schema.validate(req.body);
    if (error)  return next({ status: 422, code: 10001, message: error.details[0].message });
    next();
};