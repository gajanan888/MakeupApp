import bcrypt from "bcrypt";
import Admin from "../../models/Admin.js";
import generateToken from "../../utils/generateToken.js";

export const registerAdmin = async ({ name, email, password }) => {
  const existing = await Admin.findOne({
    where: { email },
  });

  if (existing) {
    throw new Error("Admin already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await Admin.create({
    name,
    email,
    password: hashedPassword,
  });

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    token: generateToken(admin.id),
  };
};

export const loginAdmin = async ({ email, password, selectedRole }) => {
  const admin = await Admin.findOne({
    where: { email },
  });

  if (!admin) {
    throw new Error("Admin not found");
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    throw new Error("Invalid password");
  }

  // Super Admin can log in as any role.
  // Other roles must match the database role exactly.
  if (selectedRole && admin.role !== "super_admin" && admin.role !== selectedRole) {
    throw new Error(`Access Denied: This account is authorized as a ${admin.role.replace('_', ' ')} only.`);
  }

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    token: generateToken(admin.id),
  };
};
