/**
 * @author @vidhanshu
 * @fileoverview This file contains the auth middleware which is used to authenticate the user
 * @description: This middleware takes the JWT from the header and verifies if it is valid and if it is valid the JWT will provide the user id which was used to create JWT. this user id can be stored for the further processing
 */

const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const {
  JWT_SECRET,
  DATABASE_USERNAME,
  DATABASE_HOST,
  DATABASE_PASSWORD,
  DATABASE_NAME,
} = require("../configs/env");
const { DATABASE_CONCURRENT_CONNECTIONS } = require("../configs/constants");
const { UNAUTHORIZED, UNAUTHORIZED_CODE } = require("../configs/response");
const { sendResponse } = require("../utils/SendResponse");
const auth = async (req, res, next) => {
  const pool = mysql.createPool({
    host: DATABASE_HOST,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    user: DATABASE_USERNAME,
    connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
  });
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      sendResponse(res, true, UNAUTHORIZED, null, UNAUTHORIZED_CODE);
      return;
    }
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      "SELECT id FROM users WHERE id = ?",
      [decoded.id]
    );
    if (!users.length) {
      sendResponse(res, true, UNAUTHORIZED, null, UNAUTHORIZED_CODE);
      return;
    }
    const [results] = await connection.execute(
      "SELECT * FROM access_tokens WHERE user_id = ? AND access_token = ?",
      [decoded.id, token]
    );
    if (!results.length) {
      sendResponse(res, true, UNAUTHORIZED, null, UNAUTHORIZED_CODE);
      return;
    }
    req.user = { id: decoded.id };
    req.token = token;
    next();
  } catch (e) {
    sendResponse(res, true, UNAUTHORIZED, null, UNAUTHORIZED_CODE);
  } finally {
    pool.end();
  }
};

module.exports = auth;
