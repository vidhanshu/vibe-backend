const mysql = require("mysql2/promise");
const sharp = require("sharp");
const {
  POST_IMAGE_RESIZE_VALUE_WIDTH,
  POST_IMAGE_RESIZE_VALUE_HEIGHT,
  DATABASE_CONCURRENT_CONNECTIONS,
} = require("../configs/constants");
const {
  INTERNAL_ERROR,
  INTERNAL_ERROR_CODE,
  CREATED,
  CREATED_CODE,
  DATA_NOT_PROVIDED,
  BAD_REQUEST_CODE,
  SUCCESS,
  SUCCESS_CODE,
  NOT_FOUND,
  NOT_FOUND_CODE,
} = require("../configs/response");
const {
  DATABASE_HOST,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  DATABASE_USERNAME,
  POST_IMAGE_SERVING_URL,
  PROFILE_IMAGE_SERVING_URL,
} = require("../configs/env");
const { sendResponse } = require("../utils/SendResponse");
const pool = require("../pool");
/**
 * @description Get post all posts by id
 */
const GetPosts = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { limit, offset } = req.query;
    let query =
      "SELECT posts.id,posts.user_id, users.name, users.username, posts.caption, posts.user_id, posts.createdAt, posts.updatedAt, (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likes FROM posts JOIN users ON users.id = posts.user_id WHERE user_id = ?";
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    if (offset) {
      query += ` OFFSET ${offset}`;
    }
    const [results] = await connection.execute(query, [id]);

    const DataToSend = results.map((result) => {
      return {
        ...result,
        profile: `${PROFILE_IMAGE_SERVING_URL}/${result.id}`,
        image: `${POST_IMAGE_SERVING_URL}/${result.id}`,
      };
    });
    sendResponse(res, false, SUCCESS, DataToSend, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection.release();
  }
};

/**
 * @description Get post image
 *
 */
const GetPostImage = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const [results] = await connection.execute(
      "SELECT image FROM posts WHERE id = ?",
      [id]
    );
    if (!results.length) {
      res.send(null);
      return;
    }
    res.set("Content-Type", "image/png");
    res.send(results[0].image);
  } catch (error) {
    res.send(null);
  } finally {
    connection.release();
  }
};

const GetAllComments = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { limit, offset } = req.query;
    let query =
      "SELECT comments.id, comments.post_id, comments.user_id, comments.comment, comments.createdAt, comments.updatedAt, users.name, users.username FROM comments JOIN users ON users.id = comments.user_id WHERE post_id = ?";
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    if (offset) {
      query += ` OFFSET ${offset}`;
    }

    const [results] = await connection.execute(query, [id]);
    sendResponse(res, false, SUCCESS, results, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection.release();
  }
};

/**
 * @description Create a post
 *
 */
const CreatePost = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.user;
    if (!req.file || !req.body.caption) {
      sendResponse(res, true, DATA_NOT_PROVIDED, null, BAD_REQUEST_CODE);
      return;
    }
    const PNG = await sharp(req.file.buffer)
      .resize(POST_IMAGE_RESIZE_VALUE_WIDTH, POST_IMAGE_RESIZE_VALUE_HEIGHT)
      .toFormat("png")
      .toBuffer();
    const [results] = await connection.execute(
      "INSERT INTO posts (user_id,caption,image) VALUES (?,?,?)",
      [id, req.body.caption, PNG]
    );
    if (!results.affectedRows) {
      sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
      return;
    }
    sendResponse(res, false, CREATED, null, CREATED_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection.release();
  }
};

/**
 * @description Like a post
 *
 */
const LikePost = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.user;
    const post_id = req.params.id;
    const [results] = await connection.execute(
      "SELECT EXISTS(SELECT * FROM likes WHERE user_id = ? AND post_id = ?)",
      [id, post_id]
    );
    //if liked already remove like
    if (
      results[0][
        `EXISTS(SELECT * FROM likes WHERE user_id = ? AND post_id = ?)`
      ]
    ) {
      await connection.execute(
        "DELETE FROM `likes` WHERE `likes`.`user_id` = ? AND `likes`.`post_id` = ?",
        [id, post_id]
      );
      sendResponse(res, false, SUCCESS, null, SUCCESS_CODE);
      return;
    }
    await connection.execute(
      "INSERT INTO likes (user_id ,post_id) VALUES (?,?)",
      [id, post_id]
    );
    sendResponse(res, false, SUCCESS, null, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection.release();
  }
};
/**
 * @description updating a post caption
 */

const UpdateCaption = async (req, res) => {
  if (!req.body.caption) {
    sendResponse(
      res,
      true,
      DATA_NOT_PROVIDED,
      { error: "caption required" },
      BAD_REQUEST_CODE
    );
    return;
  }
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const [results] = await connection.execute(
      "UPDATE posts SET caption = ? WHERE id = ? AND user_id = ?",
      [req.body.caption, id, req.user.id]
    );
    if (!results.affectedRows) {
      sendResponse(res, true, NOT_FOUND, null, NOT_FOUND_CODE);
      return;
    }
    sendResponse(res, false, SUCCESS, null, SUCCESS_CODE);
  } catch (error) {
  } finally {
    connection.release();
  }
};

const UpdatePostImage = async (req, res) => {
  if (!req.file) {
    sendResponse(res, true, DATA_NOT_PROVIDED, null, BAD_REQUEST_CODE);
    return;
  }

  const connection = await pool.getConnection();
  try {
    const { id } = req.user;
    const post_id = req.params.id;
    const PNG = await sharp(req.file.buffer)
      .resize(POST_IMAGE_RESIZE_VALUE_WIDTH, POST_IMAGE_RESIZE_VALUE_HEIGHT)
      .toFormat("png")
      .toBuffer();
    const [results] = await connection.execute(
      "UPDATE posts SET image = ? WHERE id = ? AND user_id = ?",
      [PNG, post_id, id]
    );
    if (!results.affectedRows) {
      sendResponse(res, true, NOT_FOUND, null, NOT_FOUND_CODE);
      return;
    }
    sendResponse(res, false, SUCCESS, null, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection.release();
  }
};

const Comment = async (req, res) => {
  if (!req.body.comment) {
    sendResponse(
      res,
      true,
      DATA_NOT_PROVIDED,
      { error: "comment required" },
      BAD_REQUEST_CODE
    );
    return;
  }
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const [results] = await connection.execute(
      "INSERT INTO comments (user_id,post_id,comment) VALUES (?,?,?)",
      [req.user.id, id, req.body.comment]
    );
    if (!results.affectedRows) {
      sendResponse(res, true, NOT_FOUND, null, NOT_FOUND_CODE);
      return;
    }
    sendResponse(res, false, SUCCESS, null, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection.release();
  }
};

const UpdateComment = async (req, res) => {
  if (!req.body.comment) {
    sendResponse(
      res,
      true,
      DATA_NOT_PROVIDED,
      { error: "comment required" },
      BAD_REQUEST_CODE
    );
    return;
  }
  const connection = await pool.getConnection();
  try {
    const { id } = req.user;
    const comment_id = req.params.id;
    const [results] = await connection.execute(
      "UPDATE comments SET comment = ? WHERE id = ? AND user_id = ?",
      [req.body.comment, comment_id, id]
    );
    if (!results.affectedRows) {
      sendResponse(res, true, NOT_FOUND, null, NOT_FOUND_CODE);
      return;
    }
    sendResponse(res, false, SUCCESS, null, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection.release();
  }
};

const DeletePost = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.user;
    const post_id = req.params.id;
    const [results] = await connection.execute(
      "DELETE FROM posts WHERE id = ? AND user_id = ?",
      [post_id, id]
    );
    if (!results.affectedRows) {
      sendResponse(res, true, NOT_FOUND, null, NOT_FOUND_CODE);
      return;
    }
    sendResponse(res, false, SUCCESS, null, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection.release();
  }
};

const DeleteComment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.user;
    const comment_id = req.params.id;
    const [results] = await connection.execute(
      "DELETE FROM comments WHERE id = ? AND user_id = ?",
      [comment_id, id]
    );
    if (!results.affectedRows) {
      sendResponse(res, true, NOT_FOUND, null, NOT_FOUND_CODE);
      return;
    }
    sendResponse(res, false, SUCCESS, null, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection.release();
  }
};

module.exports = {
  CreatePost,
  GetPostImage,
  GetPosts,
  LikePost,
  UpdateCaption,
  UpdatePostImage,
  Comment,
  UpdateComment,
  DeleteComment,
  GetAllComments,
  DeletePost,
};
