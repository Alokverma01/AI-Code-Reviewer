const express = require("express");
const {
  createUser,
  getUser,
} = require("../../controller/userController/user.controller");

const userRouter = express.Router();

userRouter.post("/user/create-user", createUser);
userRouter.get("/user/get-user", getUser);

module.exports = userRouter;
