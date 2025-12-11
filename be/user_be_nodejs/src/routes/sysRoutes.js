const router = require('express').Router();
const sysCtrl = require('../controllers/sysController');

/**
 * @ApiTag("Sys")
 */

/**
 * @Api("获取后端类型", "", "")
 */
router.get('/be_type', sysCtrl.getBeType);

module.exports = router;