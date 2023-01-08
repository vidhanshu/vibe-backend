const {
  EMAIL_REGEX,
  USERNAME_REGEX,
  PASSWORD_REGEX,
} = require("../configs/constants");
const {
  DATA_NOT_PROVIDED,
  INVALID_EMAIL,
  INVALID_USERNAME,
  INVALID_PASSWORD,
  SQL_DUPLICATE_ENTRY,
} = require("../configs/response");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../configs/env");
/**
 * @abstract This function checks if the user has provided all the required details for registration
 *
 * @param {string} email
 * @param {string} username
 * @param {string} password
 * @returns {Object}
 */
const checkValidUserRegistrationDetails = (email, username, password) => {
  if (!username || !email || !password) {
    return { error: true, status: DATA_NOT_PROVIDED };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: true, status: INVALID_EMAIL };
  }

  if (!USERNAME_REGEX.test(username)) {
    return { error: true, status: INVALID_USERNAME };
  }

  if (!PASSWORD_REGEX.test(password)) {
    return { error: true, status: INVALID_PASSWORD };
  }

  return { error: false, status: null };
};

/**
 * @abstract This function checks the type of sql error and returns the appropriate error message
 *
 * @param {Object} error
 * @returns {Object}
 */
const SQL_error_checker = (error) => {
  if (error.code === SQL_DUPLICATE_ENTRY) {
    return {
      error: true,
      status: error.sqlMessage.includes("email")
        ? "EMAIL_ALREADY_EXISTS"
        : "USERNAME_ALREADY_EXISTS",
    };
  }
  return {
    error: false,
    status: null,
  };
};

/**
 *@description name generator from email
 *
 */
const generateNameFromEmail = (email) => {
  try {
    let name = email.substring(0, email.indexOf("@"));
    name = name.replace(/\./g, " ");
    name = name.replace(/\b\w/g, (l) => l.toUpperCase());
    if (name.length > 30) {
      name = name.substring(0, 30);
    }
    // Replace any invalid characters with underscores
    return name.replace(/[^a-zA-Z0-9_ ]/g, "");
  } catch (error) {
    return `user${GenerateRandomNumber(1, 100)}${GenerateRandomNumber(
      1,
      75
    )}${GenerateRandomNumber(1, 1000)}}`;
  }
};
const GenerateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * @description generate sql formatted date timestamp
 */
const CURRENT_TIMESTAMP = () => {
  let date = new Date().toISOString();
  const formatted_date = date.substring(0, 10);
  date = new Date(date).toLocaleString();
  const formatted_time = date.substring(10, 18);
  console.log(`${formatted_date} ${formatted_time}`);
  return `${formatted_date} ${formatted_time}`;
};

/**
 * @description the time after specific minutes
 */

const TIMESTAMP_AFTER_SPECIFIC_MINS = (MINS) => {
  let date = new Date();
  return new Date(date.setMinutes(date.getMinutes() + MINS));
};

const getUserIdFromJWT = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (error) {
    return null;
  }
};
module.exports = {
  checkValidUserRegistrationDetails,
  SQL_error_checker,
  generateNameFromEmail,
  generateNameFromEmail,
  CURRENT_TIMESTAMP,
  TIMESTAMP_AFTER_SPECIFIC_MINS,
  getUserIdFromJWT,
};
