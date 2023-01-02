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
  
  module.exports = {
    checkValidUserRegistrationDetails,
    SQL_error_checker,
  };