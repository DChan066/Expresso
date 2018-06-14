const express = require('express');
const apiRouter = express.Router();

const employeesRouter = require('./employee');
const menusRouter = require('./menu');

apiRouter.use('/employees', employeesRouter);
apiRouter.use('/menus', menusRouter);

module.exports = apiRouter;
