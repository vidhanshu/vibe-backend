const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const sharp = require("sharp");
const {
  DATABASE_CONCURRENT_CONNECTIONS,
  PROFILE_IMAGE_RESIZE_VALUE,
} = require("../configs/constants");
const {
  BAD_REQUEST_CODE,
  SUCCESS_CODE,
  INTERNAL_ERROR_CODE,
  SUCCESS,
} = require("../configs/response");
const { sendResponse } = require("../utils/SendResponse.js");
const {
  DATABASE_USERNAME,
  DATABASE_HOST,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  PROFILE_IMAGE_SERVING_URL,
} = require("../configs/env");

const GetProfile = async (req, res) => {
  const pool = mysql.createPool({
    host: DATABASE_HOST,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    user: DATABASE_USERNAME,
    connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
  });
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [results] = await connection.execute(
      "SELECT * FROM user WHERE id = ?",
      [id]
    );
    if (results.length === 0) {
      return sendResponse(res, true, "user not exists", null, BAD_REQUEST_CODE);
    }
    const DataToBeSent = results[0];
    delete DataToBeSent.password;
    DataToBeSent.profile = `${PROFILE_IMAGE_SERVING_URL}/${id}`;
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
    pool.end();
  }
};

const GetProfileImage = async (req, res) => {
  const pool = mysql.createPool({
    host: DATABASE_HOST,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    user: DATABASE_USERNAME,
    connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
  });

  try {
    const { id } = req.params;
    console.log(id);
    const connection = await pool.getConnection();
    const [results] = await connection.execute(
      "SELECT profile FROM user WHERE id = ?",
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
    res.setHeader("Cache-Control", "public, max-age=3000");
    res.set("Content-Type", "image/png");
    res.send(Buffer.from(profile, "base64"));
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
    pool.end();
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

  const pool = mysql.createPool({
    host: DATABASE_HOST,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    user: DATABASE_USERNAME,
    connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
  });

  try {
    //getting id from middleware
    const { id } = req.user;
    const connection = await pool.getConnection();
    // Check if user with given ID exists
    const [user] = await connection.execute(
      "SELECT EXISTS(SELECT 1 FROM user WHERE id = ?)",
      [id]
    );

    if (user[0]["EXISTS(SELECT 1 FROM user WHERE id = ?)"] === 0) {
      // User with given ID does not exist
      return sendResponse(res, true, "user not exists", null, BAD_REQUEST_CODE);
    }
    // Update user's name
    await connection.execute("UPDATE user SET name = ? WHERE id = ?", [
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
    pool.end();
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

  const pool = mysql.createPool({
    host: DATABASE_HOST,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    user: DATABASE_USERNAME,
    connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
  });

  try {
    const { id } = req.user;
    const connection = await pool.getConnection();
    // Check if user with given ID exists
    const [user] = await connection.execute(
      "SELECT EXISTS(SELECT 1 FROM user WHERE id = ?)",
      [id]
    );

    if (user[0]["EXISTS(SELECT 1 FROM user WHERE id = ?)"] === 0) {
      // User with given ID does not exist
      return sendResponse(res, true, "user not exists", null, BAD_REQUEST_CODE);
    }
    // Update user's bio
    await connection.execute("UPDATE user SET bio = ? WHERE id = ?", [bio, id]);
    // Return success response
    sendResponse(res, false, "Bio updated", null, SUCCESS_CODE);
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
    pool.end();
  }
};
/**
 * @abstract Update user's profile
 */
const UpdateProfile = async (req, res) => {
  const pool = mysql.createPool({
    host: DATABASE_HOST,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    user: DATABASE_USERNAME,
    connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
  });

  try {
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
    const connection = await pool.getConnection();
    // Check if user with given ID exists
    const [user] = await connection.execute(
      "SELECT EXISTS(SELECT 1 FROM user WHERE id = ?)",
      [id]
    );

    if (user[0]["EXISTS(SELECT 1 FROM user WHERE id = ?)"] === 0) {
      // User with given ID does not exist
      return sendResponse(res, true, "user not exists", null, BAD_REQUEST_CODE);
    }
    // Update user's profile
    await connection.execute("UPDATE user SET profile = ? WHERE id = ?", [
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
    pool.end();
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

  const pool = mysql.createPool({
    host: DATABASE_HOST,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    user: DATABASE_USERNAME,
    connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
  });

  try {
    const { id } = req.user;
    const connection = await pool.getConnection();
    // Check if user with given ID exists
    const [user] = await connection.execute(
      "SELECT EXISTS(SELECT 1 FROM user WHERE id = ?)",
      [id]
    );

    if (user[0]["EXISTS(SELECT 1 FROM user WHERE id = ?)"] === 0) {
      // User with given ID does not exist
      return sendResponse(res, true, "user not exists", null, BAD_REQUEST_CODE);
    }
    // Update user's mobile
    await connection.execute("UPDATE user SET mobile = ? WHERE id = ?", [
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
    pool.end();
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
  const pool = mysql.createPool({
    host: DATABASE_HOST,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    user: DATABASE_USERNAME,
    connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
  });

  try {
    const { id } = req.user;
    const connection = await pool.getConnection();
    const [user] = await connection.execute(
      "SELECT EXISTS(SELECT 1 FROM user WHERE id = ?)",
      [id]
    );
    //checkin if user exists
    if (user[0]["EXISTS(SELECT 1 FROM user WHERE id = ?"] === 0) {
      return sendResponse(res, true, "user not exists", null, BAD_REQUEST_CODE);
    }
    //check if username already taken
    const [rows] = await connection.execute(
      "SELECT EXISTS(SELECT 1 FROM user WHERE username = ?)",
      [username]
    );

    if (rows[0]["EXISTS(SELECT 1 FROM user WHERE username = ?)"] === 1) {
      return sendResponse(
        res,
        true,
        "username already exists",
        null,
        BAD_REQUEST_CODE
      );
    }
    //update username
    await connection.execute("UPDATE user SET username = ? WHERE id = ?", [
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
    pool.end();
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
  const pool = mysql.createPool({
    host: DATABASE_HOST,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    user: DATABASE_USERNAME,
    connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
  });

  try {
    const { id } = req.user;
    const connection = await pool.getConnection();
    const [user] = await connection.execute(
      "SELECT EXISTS(SELECT 1 FROM user WHERE id = ?)",
      [id]
    );
    //checkin if user exists
    if (user[0]["EXISTS(SELECT 1 FROM user WHERE id = ?"] === 0) {
      return sendResponse(res, true, "user not exists", null, BAD_REQUEST_CODE);
    }
    //check if username already taken
    const [rows] = await connection.execute(
      "SELECT EXISTS(SELECT 1 FROM user WHERE email = ?)",
      [email]
    );

    if (rows[0]["EXISTS(SELECT 1 FROM user WHERE email = ?)"] === 1) {
      return sendResponse(
        res,
        true,
        "email already exists",
        null,
        BAD_REQUEST_CODE
      );
    }
    //update email
    await connection.execute("UPDATE user SET email = ? WHERE id = ?", [
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
    pool.end();
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
  const pool = mysql.createPool({
    host: DATABASE_HOST,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    user: DATABASE_USERNAME,
    connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
  });

  try {
    const { id } = req.user;
    const connection = await pool.getConnection();
    const [user] = await connection.execute(
      "SELECT EXISTS(SELECT 1 FROM user WHERE id = ?)",
      [id]
    );
    //checkin if user exists
    if (user[0]["EXISTS(SELECT 1 FROM user WHERE id = ?"] === 0) {
      return sendResponse(res, true, "user not exists", null, BAD_REQUEST_CODE);
    }
    const hash = await bcrypt.hash(password, 10);
    //update password
    await connection.execute("UPDATE user SET password = ? WHERE id = ?", [
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
    pool.end();
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
};
