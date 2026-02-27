const express = require("express");
const userRouter = require("./UserRoutes/userRoutes");

const MainRouter = express.Router();

MainRouter.use(userRouter);

module.exports = MainRouter;
