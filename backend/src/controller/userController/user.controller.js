const User = require("../../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const transporter = require("../../config/nodemailer");
const { userSchema, loginSchema } = require("../../validation/validate");
const {
  WELCOME_MESSAGE_TEMPLATE,
  EMAIL_VERIFY_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
} = require("../../utils/emailTemplate");

const createUser = async (req, res) => {
  try {
    const result = userSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        status: false,
        message: result.error.errors[0].message,
      });
    }
    const { name, email, password } = result.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "User already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await transporter.sendMail(WELCOME_MESSAGE_TEMPLATE(name, email));
    return res.status(200).json({
      status: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!",
    });
  }
};
const getUser = async (_req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({
      status: true,
      message: "Users fetched successfully ",
      data: users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server Erorr!",
    });
  }
};
const login = async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        status: false,
        message: result.error.errors[0].message,
      });
    }

    const { email, password } = result.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "Invalid credentials",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Invalid Credentials",
      });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("error", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};
const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "none",
    });
    return res.status(200).json({
      success: true,
      message: "Logged Out",
    });
  } catch (error) {
    console.error("error", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};
const sendVerifyOtp = async (req, res) => {
  try {
    const { user_id } = req.body;
    const user = await User.findById(user_id);
    if (user.isAccountVerified) {
      return res.status(400).json({
        status: false,
        message: "Account Already verified",
      });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email,
      ),
    };

    await transporter.sendMail(mailOption);

    return res.status(200).json({
      status: true,
      message: "Verification OTP Sent on Email",
    });
  } catch (error) {
    console.error("error", error);
    return res.status(500).json({
      status: false,
      mesage: "Internal Server Error",
    });
  }
};
const verifyEmail = async (req, res) => {
  const { user_id, otp } = req.body;
  if (!user_id && !otp) {
    return res.status(400).json({
      status: false,
      message: "Missing Details",
    });
  }
  try {
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "User Not found",
      });
    }
    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.status(400).json({
        status: false,
        mesage: "Invalid OTP",
      });
    }
    if (user.verifyOtpExpireAt < Date.now()) {
      return res.status(400).json({
        status: false,
        message: "OTP Expired",
      });
    }
    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;

    await user.save();
    return res.status(200).json({
      status: false,
      message: "Email Verified Successfully",
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};
const isAuthenticated = async (req, res) => {
  try {
    return res.status(200).json({ status: true });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      status: false,
      message: "Email is required",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "User not found",
      });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email,
      ),
    };

    await transporter.sendMail(mailOption);
    return res.status(200).json({
      status: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, new_password } = req.body;
  if (!email || !otp || !new_password) {
    return res.status(400).json({
      status: false,
      message: "Details are required",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "User not found",
      });
    }
    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP",
      });
    }
    if (user.resetOtpExpireAt < Date.now()) {
      return res.status(400).json({
        status: false,
        message: "OTP Expired",
      });
    }
    const hashedPassword = await bcrypt.hash(new_password, 10);

    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;

    await user.save();
    return res.status(200).json({
      status: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("error", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  createUser,
  getUser,
  login,
  logout,
  sendVerifyOtp,
  verifyEmail,
  isAuthenticated,
  sendResetOtp,
  resetPassword,
};
