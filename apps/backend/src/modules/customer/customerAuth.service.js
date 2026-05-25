import bcrypt from "bcrypt";
import Customer from "../../models/Customer.js";
import generateToken from "../../utils/generateToken.js";

export const registerCustomer = async (data) => {
  const { name, email, phone, password } = data;

  const existingUser = await Customer.findOne({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Customer already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const customer = await Customer.create({
    name,
    email,
    phone,
    password: hashedPassword,
  });

  return {
    id: customer.id,
    name: customer.name,
    token: generateToken(customer.id),
  };
};

export const loginCustomer = async ({ email, password }) => {
  const customer = await Customer.findOne({
    where: { email },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  const isMatch = await bcrypt.compare(password, customer.password);

  if (!isMatch) {
    throw new Error("Invalid password");
  }

  return {
    id: customer.id,
    name: customer.name,
    token: generateToken(customer.id),
  };
};
