import User from "../models/User.js";

export const register = async (userData) => {
  const user = await user.create(data);
  return user;
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });

  if (!user || user.password !== password) {
    throw new Error("Invalid credentials");
  }

  return user;
};
