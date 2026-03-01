const express = require("express");
const {
  createUser,
  getUser,
  login,
  logout,
  sendVerifyOtp,
  verifyEmail,
  isAuthenticated,
  sendResetOtp,
  resetPassword,
} = require("../../controller/userController/user.controller");

const userRouter = express.Router();

userRouter.post("/auth/register", createUser);
userRouter.get("/user/me", getUser);
userRouter.post("/auth/login", login);
userRouter.delete("/auth/logout", logout);
userRouter.post("/auth/send-verification-otp", sendVerifyOtp);
userRouter.post("/auth/verify-email", verifyEmail);
userRouter.post("/auth/send-reset-otp", sendResetOtp);
userRouter.patch("/auth/reset-password", resetPassword);

module.exports = userRouter;
