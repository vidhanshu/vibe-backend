const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../configs/env");
const { DATABASE_CONCURRENT_CONNECTIONS } = require("../configs/constants");
const { UNAUTHORIZED, UNAUTHORIZED_CODE } = require("../configs/response");
const { sendResponse } = require("../utils/SendResponse");
const pool = require("../pool");
const auth = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      sendResponse(res, true, UNAUTHORIZED, null, UNAUTHORIZED_CODE);
      return;
    }
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
    console.log(e);
    sendResponse(res, true, UNAUTHORIZED, null, UNAUTHORIZED_CODE);
  } finally {
    connection.release();
  }
};

module.exports = auth;
