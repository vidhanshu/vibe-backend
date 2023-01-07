/**
 * @author @vidhanshu
 * @fileoverview This file contains the middleware to check if the user is following the user whose profile is being viewed
 * @description: This middleware takes the user id from the params and checks if the user is following the user whose profile is being viewed
 */
const mysql = require("mysql2/promise");
const { DATABASE_CONCURRENT_CONNECTIONS } = require("../configs/constants");
const {
  DATABASE_HOST,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  DATABASE_USERNAME,
} = require("../configs/env");
const { INTERNAL_ERROR, INTERNAL_ERROR_CODE } = require("../configs/response");
const { sendResponse } = require("../utils/SendResponse");
const pool = require("../pool");

const follower = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { id: userId } = req.user;
    const [results] = await connection.execute(
      "SELECT EXISTS(SELECT * FROM followers WHERE follower_id = ? AND user_id = ?) AS isFollowing",
      [userId, id]
    );
    if (results[0].isFollowing === 0) {
      return sendResponse(
        res,
        true,
        "You are not following this user",
        "You are not following this user",
        400
      );
    }
    next();
  } catch (error) {
    console.log(error);
    sendResponse(
      res,
      true,
      INTERNAL_ERROR,
      "Internal Server Error",
      INTERNAL_ERROR_CODE
    );
  } finally {
    connection.release();
  }
};

module.exports = follower;
