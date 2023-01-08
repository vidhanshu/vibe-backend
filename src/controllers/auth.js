const { EMAIL_REGEX } = require("../configs/constants.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  BAD_REQUEST_CODE,
  INTERNAL_ERROR,
  INTERNAL_ERROR_CODE,
  INVALID_PASSWORD,
  INVALID_EMAIL,
  CREATED_CODE,
  CREATED,
  SUCCESS_CODE,
  SUCCESS,
} = require("../configs/response.js");
const { sendResponse } = require("../utils/SendResponse.js");
const {
  checkValidUserRegistrationDetails,
  generateNameFromEmail,
  CURRENT_TIMESTAMP,
} = require("../utils/utils.js");
const { JWT_SECRET, PROFILE_IMAGE_SERVING_URL } = require("../configs/env.js");
const pool = require("../pool.js");

/**
 * @abstract Create user
 *
 * @param {Object} req
 * @param {Object} res
 * @returns null
 */
async function CreateUser(req, res) {
  const { username, email, password } = req.body;

  const verification = checkValidUserRegistrationDetails(
    email,
    username,
    password
  );

  if (verification.error) {
    sendResponse(res, true, verification.status, null, BAD_REQUEST_CODE);
    return;
  }

  let connection = null;
  try {
    connection = await pool.getConnection();
    const hashedPassword = await bcrypt.hash(password, 10);
    const [results] = await connection.execute(
      "INSERT INTO users(username, email, password, name) VALUES (?,?,?,?)",
      [username, email, hashedPassword, generateNameFromEmail(email)]
    );
    const token = jwt.sign({ id: results.insertId }, JWT_SECRET);
    await connection.execute(
      "INSERT INTO access_tokens (user_id, access_token) VALUES(?,?)",
      [results.insertId, token]
    );
    const [users] = await connection.execute(
      "SELECT id, name, username, email, mobile, bio FROM users WHERE id = ?",
      [results.insertId]
    );
    const DataToBeSent = users[0];
    DataToBeSent.profile = `${PROFILE_IMAGE_SERVING_URL}/${DataToBeSent.id}`;
    sendResponse(
      res,
      false,
      CREATED,
      {
        token,
        user: DataToBeSent,
      },
      CREATED_CODE
    );
  } catch (error) {
    sendResponse(
      res,
      true,
      INTERNAL_ERROR,
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    connection?.release();
  }
}

/**
 * @abstract Login user
 *
 * @param {Object} req
 * @param {Object} res
 * @returns null
 */
async function LoginUser(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    sendResponse(
      res,
      true,
      "Please provide email and password",
      null,
      BAD_REQUEST_CODE
    );
    return;
  }
  let login_query = "";

  if (EMAIL_REGEX.test(email)) {
    login_query =
      "SELECT id, lastLogin, name, username, email, mobile, bio, password FROM users WHERE email = ?";
  } else {
    login_query =
      "SELECT id, lastLogin, name, username, email, mobile, bio, password FROM users WHERE username = ?";
  }
  let connection = null;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(login_query, [email]);
    //user doesn't exists
    if (results.length === 0) {
      sendResponse(
        res,
        true,
        INVALID_EMAIL,
        {
          error: "Invalid email",
        },
        BAD_REQUEST_CODE
      );
      return;
    }
    const PasswordVerification = await bcrypt.compare(
      password,
      results[0].password
    );

    if (!PasswordVerification) {
      console.error("Invalid password");
      sendResponse(
        res,
        true,
        INVALID_PASSWORD,
        {
          error: "Invalid password",
        },
        BAD_REQUEST_CODE
      );
      return;
    }
    const token = jwt.sign({ id: results[0].id }, JWT_SECRET);
    await connection.execute(
      "INSERT INTO access_tokens (user_id,access_token) VALUES(?,?)",
      [results[0].id, token]
    );
    //updating the last login time
    await connection.execute("UPDATE users SET lastLogin = ? WHERE id = ?", [
      CURRENT_TIMESTAMP(),
      results[0].id,
    ]);
    //refactoring the data to be send
    const DataToBeSent = results[0];
    delete DataToBeSent.password;
    DataToBeSent.lastLogin = CURRENT_TIMESTAMP();
    DataToBeSent.profile = `${PROFILE_IMAGE_SERVING_URL}/${DataToBeSent.id}`;
    sendResponse(res, false, "User logged in successfully", {
      token,
      user: DataToBeSent,
    });
  } catch (error) {
    console.log(error);
    sendResponse(
      res,
      true,
      INTERNAL_ERROR,
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    connection?.release();
  }
}

async function LogoutUser(req, res) {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.user;
    const token = req.token;
    const [results] = await connection.execute(
      "DELETE FROM access_tokens WHERE access_token = ? AND user_id = ?",
      [token, id]
    );
    if (results.affectedRows === 0) {
      sendResponse(
        res,
        true,
        "Invalid token",
        {
          error: "Invalid token",
        },
        BAD_REQUEST_CODE
      );
      return;
    }
    sendResponse(
      res,
      false,
      "User logged out successfully",
      null,
      SUCCESS_CODE
    );
  } catch (error) {
    sendResponse(
      res,
      true,
      INTERNAL_ERROR,
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    connection?.release();
  }
}

async function LogoutAllUser(req, res) {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.user;
    const [results] = await connection.execute(
      "DELETE FROM access_tokens WHERE user_id = ?",
      [id]
    );
    if (results.affectedRows === 0) {
      sendResponse(
        res,
        true,
        "Invalid token",
        {
          error: "Invalid token",
        },
        BAD_REQUEST_CODE
      );
      return;
    }
    sendResponse(
      res,
      false,
      "All users logged out successfully",
      null,
      SUCCESS_CODE
    );
  } catch (error) {
    sendResponse(
      res,
      true,
      INTERNAL_ERROR,
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    connection?.release();
  }
}

//TODO: Delete user
const DeleteUser = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.user;
    await connection.execute("DELETE FROM users WHERE id = ?", [id]);
    sendResponse(res, false, SUCCESS, "deleted successfully", SUCCESS_CODE);
  } catch (error) {
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection?.release();
  }
};

module.exports = {
  CreateUser,
  LoginUser,
  LogoutAllUser,
  LogoutUser,
  DeleteUser,
};
