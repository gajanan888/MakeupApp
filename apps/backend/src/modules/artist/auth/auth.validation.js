/**
 * Validate artist registration input.
 * @param {Object} data Request body
 * @returns {Object} { errors: string[] }
 */
export const validateRegister = (data) => {
  const { name, email, password } = data;
  const errors = [];

  if (!name || !name.trim()) {
    errors.push("Name is required");
  }

  if (!email || !email.trim()) {
    errors.push("Email is required");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push("Invalid email format");
    }
  }

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  return { errors };
};

/**
 * Validate artist login input.
 * @param {Object} data Request body
 * @returns {Object} { errors: string[] }
 */
export const validateLogin = (data) => {
  const { email, password } = data;
  const errors = [];

  if (!email || !email.trim()) {
    errors.push("Email is required");
  }

  if (!password) {
    errors.push("Password is required");
  }

  return { errors };
};
