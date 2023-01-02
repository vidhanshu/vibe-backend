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
  } = require("../configs/response");
  const { sendResponse } = require("../utils/SendResponse.js");
  const { checkValidUserRegistrationDetails } = require("../utils/utils");
  const { JWT_SECRET } = require("../configs/env");
  
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
      const pool = mysql.createPool({
        host: "localhost",
        password: "",
        database: "vibe_db",
        user: "root",
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
      const [user] = await connection.execute("SELECT * FROM user WHERE id = ?", [
        results.insertId,
      ]);
      delete user[0].password;
      sendResponse(res, false, "User created successfully", {
        token,
        user: user[0],
      });
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
      login_query = "SELECT * FROM user WHERE email = ?";
    } else {
      login_query = "SELECT * FROM user WHERE username = ?";
    }
  
    const pool = mysql.createPool({
      host: "localhost",
      password: "",
      database: "vibe_db",
      user: "root",
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
      console.log(password, results[0].password);
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
  
      delete results[0].password;
      sendResponse(res, false, "User logged in successfully", {
        token,
        user: results[0],
      });
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
  
  async function LogoutUser(req, res) {
    const { id } = req.user;
    const token = req.token;
    const pool = mysql.createPool({
      host: "localhost",
      password: "",
      database: "vibe_db",
      user: "root",
      connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
    });
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
    sendResponse(res, false, "User logged out successfully");
  }
  
  async function LogoutAllUser(req, res) {
    const { id } = req.id;
    const pool = mysql.createPool({
      host: "localhost",
      password: "",
      user: "root",
      database: "vibe_db",
      connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
    });
  
    const connection = await pool.getConnection();
    const [results] = await connection.execute(
      "DELETE FROM acess_tokens WHERE user_id = ?",
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
    sendResponse(res, false, "User logged out successfully");
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