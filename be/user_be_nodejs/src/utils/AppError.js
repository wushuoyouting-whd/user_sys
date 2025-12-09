// src/utils/AppError.js
class AppError extends Error {
    constructor(code, message, status = 500) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = 'AppError';
    }
}

module.exports = AppError;
