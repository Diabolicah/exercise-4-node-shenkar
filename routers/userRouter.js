const { Router }  = require('express');
const { userController } = require('../controllers/userController');

const userRouter = Router();

userRouter.post('/register', userController.registerUser);

module.exports = { userRouter };