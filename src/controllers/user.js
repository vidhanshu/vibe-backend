const bcrypt = require("bcryptjs");
const sharp = require("sharp");
const {
  PROFILE_IMAGE_RESIZE_VALUE,
  USERNAME_REGEX,
  EMAIL_REGEX,
} = require("../configs/constants.js");
const {
  BAD_REQUEST_CODE,
  SUCCESS_CODE,
  INTERNAL_ERROR_CODE,
  SUCCESS,
  INTERNAL_ERROR,
} = require("../configs/response.js");
const { sendResponse } = require("../utils/SendResponse.js");
const { PROFILE_IMAGE_SERVING_URL } = require("../configs/env.js");
const pool = require("../pool.js");

const GetProfile = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    console.log("first");
    const { id } = req.params;
    const { id: user_id } = req.user;
    const [results] = await connection.execute(
      "SELECT *,(SELECT COUNT(*) FROM  followers WHERE user_id = users.id) AS followers,(SELECT COUNT(*) FROM  followers WHERE follower_id = users.id) AS following FROM users WHERE id = ?",
      [id]
    );
    if (results.length === 0) {
      return sendResponse(res, true, "user not exists", null, BAD_REQUEST_CODE);
    }
    const [chats] = await connection.execute(
      "SELECT * FROM chats WHERE (participant_1 = ? AND participant_2 = ?) OR (participant_1 = ? AND participant_2 = ?)",
      [id, user_id, user_id, id]
    );
    const DataToBeSent = results[0];
    delete DataToBeSent.password;
    DataToBeSent.profile = `${PROFILE_IMAGE_SERVING_URL}/${id}?${Date.now()}}`;
    if (chats.length !== 0) {
      DataToBeSent.chat_id = chats[0].id;
    } else {
      DataToBeSent.chat_id = null;
    }
    return sendResponse(res, false, SUCCESS, DataToBeSent, SUCCESS_CODE);
  } catch (error) {
    sendResponse(
      res,
      true,
      "something went wrong",
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    connection?.release();
  }
};

const GetProfileImage = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;
    const [results] = await connection.execute(
      "SELECT profile FROM users WHERE id = ?",
      [id]
    );
    if (results.length === 0) {
      res.set("Content-Type", "image/png");
      res.send(null);
      return;
    }
    const { profile } = results[0];
    if (!profile) {
      res.send(null);
      return;
    }
    // res.set("Cache-control", "no-cache, no-store, must-revalidate");
    res.set("Content-Type", "image/png");
    res.send(profile);
  } catch (error) {
    console.log(error);
    sendResponse(
      res,
      true,
      "something went wrong",
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    connection?.release();
  }
};

/**
 * @abstract get Followers list
 */
const GetFollowers = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;
    const { limit, offset } = req.query;
    let query =
      "SELECT users.id, users.name, users.username  FROM followers INNER JOIN users ON followers.user_id = users.id WHERE followers.user_id = ?";
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    if (offset) {
      query += ` OFFSET ${offset}`;
    }
    const [results] = await connection.execute(query, [id]);
    const DataToBeSent = results.map((result) => {
      return {
        ...result,
        profile: `${PROFILE_IMAGE_SERVING_URL}/${result.id}`,
      };
    });
    return sendResponse(res, false, SUCCESS, DataToBeSent, SUCCESS_CODE);
  } catch (error) {
    sendResponse(
      res,
      true,
      "something went wrong",
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    connection?.release();
  }
};

const SearchUserByUserNameOrName = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { search, limit, offset } = req.query;
    if (!search) {
      return sendResponse(res, false, SUCCESS, [], SUCCESS_CODE);
    }
    let query = `SELECT users.id, users.name, users.username FROM users WHERE name LIKE '%${search}%' OR username LIKE '%${search}%'`;
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    if (offset) {
      query += ` OFFSET ${offset}`;
    }
    const [results] = await connection.execute(query);
    const DataToBeSent = results.map((result) => {
      return {
        ...result,
        profile_image: `${PROFILE_IMAGE_SERVING_URL}/${
          result.id
        }?${Date.now()}`,
      };
    });
    sendResponse(res, false, SUCCESS, DataToBeSent, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, false, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection?.release();
  }
};
/**
 * @abstract Update user's name
 */
const UpdateName = async (req, res) => {
  const { name } = req.body;
  //check if name is provided
  if (!name) {
    return sendResponse(res, true, "Name is required", null, BAD_REQUEST_CODE);
  }

  let connection = null;
  try {
    connection = await pool.getConnection();
    //getting id from middleware
    const { id } = req.user;
    // Update user's name
    await connection.execute("UPDATE users SET name = ? WHERE id = ?", [
      name,
      id,
    ]);
    // Return success response
    sendResponse(res, false, "name updated", null, SUCCESS_CODE);
  } catch (error) {
    sendResponse(
      res,
      true,
      "something went wrong",
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    // Release connection
    connection?.release();
  }
};

/**
 * @abstract Update user's bio
 */
const UpdateBio = async (req, res) => {
  const { bio } = req.body;
  if (!bio) {
    return sendResponse(res, true, "Bio is required", null, BAD_REQUEST_CODE);
  }

  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.user;
    // Update user's bio
    await connection.execute("UPDATE users SET bio = ? WHERE id = ?", [
      bio,
      id,
    ]);
    // Return success response
    sendResponse(res, false, "Bio updated", null, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(
      res,
      true,
      "something went wrong",
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    // Release connection
    connection?.release();
  }
};
/**
 * @abstract Update user's profile
 */
const UpdateProfile = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.user;
    if (!req.file) {
      return sendResponse(
        res,
        true,
        "Profile is required",
        null,
        BAD_REQUEST_CODE
      );
    }
    const PNG = await sharp(req.file.buffer)
      .resize(PROFILE_IMAGE_RESIZE_VALUE, PROFILE_IMAGE_RESIZE_VALUE)
      .toFormat("png")
      .toBuffer();
    // Update user's profile
    await connection.execute("UPDATE users SET profile = ? WHERE id = ?", [
      PNG,
      id,
    ]);
    // Return success response
    sendResponse(res, false, "Profile updated", null, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(
      res,
      true,
      "something went wrong",
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    // Release connection
    connection?.release();
  }
};
/**
 * @abstract Update user's mobile
 */
const UpdateMobile = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return sendResponse(
      res,
      true,
      "Mobile is required",
      null,
      BAD_REQUEST_CODE
    );
  }
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.user;
    // Update user's mobile
    await connection.execute("UPDATE users SET mobile = ? WHERE id = ?", [
      mobile,
      id,
    ]);
    // Return success response
    sendResponse(res, false, "Mobile updated", null, SUCCESS_CODE);
  } catch (error) {
    sendResponse(
      res,
      true,
      "something went wrong",
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    // Release connection
    connection?.release();
  }
};

/**
 * @abstract Update user's username
 */
const UpdateUsername = async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return sendResponse(
      res,
      true,
      "Username is required",
      null,
      BAD_REQUEST_CODE
    );
  }

  if (USERNAME_REGEX.test(username) === false) {
    return sendResponse(
      res,
      true,
      "Username must be alphanumeric and can contain underscore",
      null,
      BAD_REQUEST_CODE
    );
  }

  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.user;
    //check if username already taken
    const [rows] = await connection.execute(
      "SELECT EXISTS(SELECT 1 FROM users WHERE username = ?)",
      [username]
    );

    if (rows[0]["EXISTS(SELECT 1 FROM users WHERE username = ?)"] === 1) {
      return sendResponse(
        res,
        true,
        "username already exists",
        null,
        BAD_REQUEST_CODE
      );
    }
    //update username
    await connection.execute("UPDATE users SET username = ? WHERE id = ?", [
      username,
      id,
    ]);

    sendResponse(res, false, "username updated", null, SUCCESS_CODE);
  } catch (error) {
    sendResponse(
      res,
      true,
      "something went wrong",
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    //Release connection
    connection?.release();
  }
};

/**
 * @abstract Update user's email
 */
const UpdateEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return sendResponse(res, true, "Email is required", null, BAD_REQUEST_CODE);
  }

  if (EMAIL_REGEX.test(email) === false) {
    return sendResponse(
      res,
      true,
      "Email is not valid",
      null,
      BAD_REQUEST_CODE
    );
  }

  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.user;
    //check if email already taken
    const [rows] = await connection.execute(
      "SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)",
      [email]
    );

    if (rows[0]["EXISTS(SELECT 1 FROM users WHERE email = ?)"] === 1) {
      return sendResponse(
        res,
        true,
        "email already exists",
        null,
        BAD_REQUEST_CODE
      );
    }
    //update email
    await connection.execute("UPDATE users SET email = ? WHERE id = ?", [
      email,
      id,
    ]);

    sendResponse(res, false, "Email updated", null, SUCCESS_CODE);
  } catch (error) {
    sendResponse(
      res,
      true,
      "something went wrong",
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    //Release connection
    connection?.release();
  }
};
/**
 * @abstract Update user's password
 */
const UpdatePassword = async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return sendResponse(
      res,
      true,
      "Password is required",
      null,
      BAD_REQUEST_CODE
    );
  }

  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.user;
    const hash = await bcrypt.hash(password, 10);
    //update password
    await connection.execute("UPDATE users SET password = ? WHERE id = ?", [
      hash,
      id,
    ]);

    sendResponse(res, false, "password updated", null, SUCCESS_CODE);
  } catch (error) {
    sendResponse(
      res,
      true,
      "something went wrong",
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    //Release connection
    connection?.release();
  }
};

const FollowUser = async (req, res) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  let connection = null;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)",
      [id]
    );

    if (rows[0]["EXISTS(SELECT 1 FROM users WHERE id = ?)"] === 0) {
      return sendResponse(
        res,
        true,
        "user does not exist",
        null,
        BAD_REQUEST_CODE
      );
    }
    //check if user is already following
    const [rows2] = await connection.execute(
      "SELECT EXISTS(SELECT 1 FROM followers WHERE user_id = ? AND follower_id = ?)",
      [id, userId]
    );

    if (
      rows2[0][
        "EXISTS(SELECT 1 FROM followers WHERE user_id = ? AND follower_id = ?)"
      ] === 1
    ) {
      //if already following unfollow
      await connection.execute(
        "DELETE FROM followers WHERE user_id = ? AND follower_id = ?",
        [id, userId]
      );
      sendResponse(res, false, "User unfollowed", null, SUCCESS_CODE);
      return;
    }
    //follow user
    await connection.execute(
      "INSERT INTO followers (user_id, follower_id) VALUES (?, ?)",
      [id, userId]
    );

    sendResponse(res, false, "User followed", null, SUCCESS_CODE);
  } catch (error) {
    sendResponse(
      res,
      true,
      "something went wrong",
      { error: error.message },
      INTERNAL_ERROR_CODE
    );
  } finally {
    //Release connection
    connection?.release();
  }
};

module.exports = {
  UpdateName,
  UpdateUsername,
  UpdateBio,
  UpdateMobile,
  UpdateProfile,
  UpdateEmail,
  UpdatePassword,
  GetProfile,
  GetProfileImage,
  FollowUser,
  GetFollowers,
  SearchUserByUserNameOrName,
};
