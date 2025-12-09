const {randomUUID} = require("node:crypto");

/**
 * 响应数据结构
 * @param data
 * @param msg
 * @param code
 * @returns {{code: number, message: string, data, traceId: `${string}-${string}-${string}-${string}-${string}`}}
 */
exports.success = (data, msg = 'success',code = 0) => ({
    code,
    message: msg,
    data: data ?? null,
    traceId: randomUUID()
});

/**
 *
 * @param code
 * @param msg
 * @returns {{code: *, message: *, data: null, traceId: `${string}-${string}-${string}-${string}-${string}`}}
 */
exports.error = (code, msg) => ({
    code,
    message: msg,
    data: null ,
    traceId: randomUUID()
});

/**
 * 失败响应（只负责构造，不直接发响应）
 */
exports.fail = (code, msg) => ({
    code,
    message: msg,
    data: null,
    traceId: randomUUID(),
});