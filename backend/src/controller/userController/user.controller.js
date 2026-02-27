const User = require("../../model/User");

const createUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        status: false,
        message: "User details are required!",
      });
    }
    const user = await User.create({
      name,
      email,
      password,
    });
    return res.status(200).json({
      status: true,
      message: "User created successfully !",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!",
    });
  }
};
const getUser = async (req, res) => {
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

module.exports = {
  createUser,
  getUser,
};
