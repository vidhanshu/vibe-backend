const {
  DATABASE_CONCURRENT_CONNECTIONS,
  EMAIL_REGEX,
} = require("../configs/constants");
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
} = require("../configs/response");
const { sendResponse } = require("../utils/SendResponse.js");
const { checkValidUserRegistrationDetails } = require("../utils/utils");
const {
  JWT_SECRET,
  DATABASE_HOST,
  DATABASE_PASSWORD,
  DATABASE_USERNAME,
  DATABASE_NAME,
  PROFILE_IMAGE_SERVING_URL,
} = require("../configs/env");

const mysql = require("mysql2/promise");

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

  try {
    console.log(
      DATABASE_HOST,
      DATABASE_PASSWORD,
      DATABASE_NAME,
      DATABASE_USERNAME
    );
    const pool = mysql.createPool({
      host: DATABASE_HOST,
      password: DATABASE_PASSWORD,
      database: DATABASE_NAME,
      user: DATABASE_USERNAME,
      connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
    });
    const connection = await pool.getConnection();
    const hashedPassword = await bcrypt.hash(password, 10);
    const [results] = await connection.execute(
      "INSERT INTO user(username, email, password) VALUES (?,?,?)",
      [username, email, hashedPassword]
    );
    const token = jwt.sign({ id: results.insertId }, JWT_SECRET);
    await connection.execute(
      "INSERT INTO access_tokens (user_id, access_token) VALUES(?,?)",
      [results.insertId, token]
    );
    const [users] = await connection.execute(
      "SELECT id, name, username, email, mobile, bio FROM user WHERE id = ?",
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
      "SELECT id, name, username, email, mobile, bio, password FROM user WHERE email = ?";
  } else {
    login_query =
      "SELECT id, name, username, email, mobile, bio, password FROM user WHERE username = ?";
  }

  const pool = mysql.createPool({
    host: DATABASE_HOST,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    user: DATABASE_USERNAME,
    connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
  });

  try {
    const connection = await pool.getConnection();
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
    //refactoring the data to be send
    const DataToBeSent = results[0];
    delete DataToBeSent.password;
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
    pool.end();
  }
}

async function LogoutUser(req, res) {
  const pool = mysql.createPool({
    host: DATABASE_HOST,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    user: DATABASE_USERNAME,
    connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
  });
  try {
    const { id } = req.user;
    const token = req.token;
    const connection = await pool.getConnection();
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
    pool.end();
  }
}

async function LogoutAllUser(req, res) {
  const pool = mysql.createPool({
    host: DATABASE_HOST,
    password: DATABASE_PASSWORD,
    user: DATABASE_USERNAME,
    database: DATABASE_NAME,
    connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
  });

  try {
    const { id } = req.user;
    const connection = await pool.getConnection();
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
    pool.end();
  }
}

//TODO: Delete user
const DeleteUser = async (req, res) => {};

module.exports = {
  CreateUser,
  LoginUser,
  LogoutAllUser,
  LogoutUser,
  DeleteUser,
};
