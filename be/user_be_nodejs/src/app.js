require('dotenv').config();
const express = require('express');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(express.json());

app.use('/api/users', userRoutes);
app.use(errorHandler);

module.exports = app;