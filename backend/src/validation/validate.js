const { z } = require("zod");

const userSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().lowercase().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

module.exports = {
  userSchema,
  loginSchema,
};
