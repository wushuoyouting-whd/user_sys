const logger = require('../utils/logger');   // 可接 winston/pino
const { fail } = require('../utils/ApiResponse');
/**
 * 200 OK          查询/更新成功
 * 201 Created     创建成功（带 Location）
 * 204 No Content  删除成功
 * 400 Bad Request 参数非法
 * 401 Unauthorized 未登录
 * 403 Forbidden   没权限
 * 404 Not Found   资源不存在
 * 409 Conflict    业务冲突（如唯一索引）
 * 422 Unprocessable Entity 校验通过但业务校验失败
 * 500 Internal Server Error 未知系统异常
 */
module.exports = (err, req, res, _next) => {
    // 1. 日志
    logger.error('HTTP_ERROR', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        traceId: err.traceId || req.traceId,
        err: err.message,
        stack: err.stack,
    });

    // 2. 业务异常处理
    if (err.code && err.message) {
        return res.status(err.status || 500).json(fail(err.code, err.message));
    }

    // 3. 参数校验失败（Joi）
    if (err.status === 400 && err.validation) {
        return res.status(400).json(fail(10001, err.message));
    }

    // 4. 默认 500 错误
    res.status(500).json(fail(99999, 'Internal Server Error'));
};