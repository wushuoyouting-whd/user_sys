/**
 * @swagger
 * components:
 *   responses:
 *     Success:
 *       description: 操作成功
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiResponse'
 *     
 *     BadRequest:
 *       description: 请求参数错误
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     
 *     NotFound:
 *       description: 资源不存在
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     
 *     InternalServerError:
 *       description: 服务器内部错误
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *   
 *   parameters:
 *     PageParam:
 *       in: query
 *       name: page
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *       description: 页码
 *     
 *     LimitParam:
 *       in: query
 *       name: limit
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 10
 *       description: 每页数量
 *     
 *     UserIdParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: integer
 *       description: 用户ID
 *     
 *     NameQueryParam:
 *       in: query
 *       name: name
 *       schema:
 *         type: string
 *       description: 用户姓名（模糊搜索）
 *     
 *     EmailQueryParam:
 *       in: query
 *       name: email
 *       schema:
 *         type: string
 *         format: email
 *       description: 邮箱地址
 *     
 *     AgeQueryParam:
 *       in: query
 *       name: age
 *       schema:
 *         type: integer
 *         minimum: 0
 *         maximum: 150
 *       description: 年龄
 *     
 *     StartDateQueryParam:
 *       in: query
 *       name: startDate
 *       schema:
 *         type: string
 *         format: date
 *       description: 开始日期
 *     
 *     EndDateQueryParam:
 *       in: query
 *       name: endDate
 *       schema:
 *         type: string
 *         format: date
 *       description: 结束日期
 */
