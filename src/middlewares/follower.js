const {
  INTERNAL_ERROR,
  INTERNAL_ERROR_CODE,
} = require("../configs/response.js");
const { sendResponse } = require("../utils/SendResponse.js");
const pool = require("../pool.js");

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
    connection?.release();
  }
};

module.exports = follower;
