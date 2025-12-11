const { success } = require('../utils/ApiResponse');
require('dotenv').config();


exports.getBeType = async (req, res, next) => {
    try {
        res.json(success({
            beType: process.env.BE_TYPE
        }));
    } catch (e) { next(e); }
};