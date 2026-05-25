import validator from "validator";

const isPositiveInt = (value) => Number.isInteger(value) && value > 0;

export const getPagination = (page, limit) => {
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 10;

  const safePage = parsedPage > 0 ? parsedPage : 1;
  const safeLimit = parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 10;

  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
};

export const validateAdminRegister = ({ name, email, password }) => {
  const errors = [];

  if (!name || !String(name).trim()) {
    errors.push("name is required");
  }

  if (!validator.isEmail(String(email || ""))) {
    errors.push("valid email is required");
  }

  if (!password || String(password).length < 6) {
    errors.push("password must be at least 6 characters");
  }

  return errors;
};

export const validatePasswordChange = ({ currentPassword, newPassword }) => {
  const errors = [];

  if (!currentPassword) {
    errors.push("currentPassword is required");
  }

  if (!newPassword || String(newPassword).length < 6) {
    errors.push("newPassword must be at least 6 characters");
  }

  return errors;
};

export const validateBookingStatus = (status) => {
  const allowed = ["pending", "accepted", "rejected", "completed", "cancelled"];

  return allowed.includes(status);
};

export const validateIdParam = (value) => {
  const parsed = Number(value);
  if (!isPositiveInt(parsed)) {
    return { isValid: false, value: null };
  }

  return { isValid: true, value: parsed };
};
