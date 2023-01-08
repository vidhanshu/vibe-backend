const sharp = require("sharp");
const {
  POST_IMAGE_RESIZE_VALUE_WIDTH,
  POST_IMAGE_RESIZE_VALUE_HEIGHT,
} = require("../configs/constants.js");
const { CURRENT_TIMESTAMP } = require("../utils/utils.js");
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
} = require("../configs/response.js");
const {
  POST_IMAGE_SERVING_URL,
  PROFILE_IMAGE_SERVING_URL,
} = require("../configs/env.js");
const { sendResponse } = require("../utils/SendResponse.js");
const pool = require("../pool.js");

//TODO
const GetHomePosts = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.user;
    const { limit, offset } = req.query;
    let query =
      "SELECT posts.id, users.name, users.username, posts.caption, posts.user_id, posts.createdAt, posts.updatedAt, (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likes,(SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comments, (SELECT EXISTS(SELECT * FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?)) AS like_status FROM posts JOIN users ON users.id = posts.user_id ORDER BY createdAt DESC";
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    if (offset) {
      query += ` OFFSET ${offset}`;
    }
    if (!limit && !offset) {
      query += " LIMIT 10";
    }
    const [results] = await connection.execute(query, [id]);
    const DataToSend = results.map((result) => {
      return {
        ...result,
        profile: `${PROFILE_IMAGE_SERVING_URL}/${
          result.user_id
        }?${Math.random()}`,
        image: `${POST_IMAGE_SERVING_URL}/${result.id}?${Math.random()}`,
      };
    });
    sendResponse(res, false, SUCCESS, DataToSend, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection?.release();
  }
};

/**
 * @description Get post all posts by id
 */
const GetPosts = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;
    const { limit, offset } = req.query;
    let query =
      "SELECT posts.id,posts.user_id, users.name, users.username, posts.caption, posts.user_id, posts.createdAt, posts.updatedAt, (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likes FROM posts JOIN users ON users.id = posts.user_id WHERE user_id = ? ORDER BY createdAt DESC";
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    if (offset) {
      query += ` OFFSET ${offset}`;
    }
    if (!limit && !offset) {
      query += " LIMIT 10";
    }

    const [results] = await connection.execute(query, [id]);

    const DataToSend = results.map((result) => {
      return {
        ...result,
        profile: `${PROFILE_IMAGE_SERVING_URL}/${result.id}?${Math.random()}`,
        image: `${POST_IMAGE_SERVING_URL}/${result.id}?${Math.random()}`,
      };
    });
    sendResponse(res, false, SUCCESS, DataToSend, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection?.release();
  }
};

/**
 * @description Get post image
 *
 */
const GetPostImage = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;
    const [results] = await connection.execute(
      "SELECT image FROM posts WHERE id = ?",
      [id]
    );
    if (!results.length) {
      res.send(null);
      return;
    }
    res.set("Cache-control", "no-cache, no-store, must-revalidate");
    res.set("Content-Type", "image/png");
    res.send(results[0].image);
  } catch (error) {
    res.send(null);
  } finally {
    connection?.release();
  }
};

const GetAllComments = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;
    const { limit, offset } = req.query;
    let query =
      "SELECT comments.id, comments.post_id, comments.user_id, comments.comment, comments.createdAt, users.name, users.username FROM comments JOIN users ON users.id = comments.user_id WHERE post_id = ? ORDER BY createdAt DESC";
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    if (offset) {
      query += ` OFFSET ${offset}`;
    }
    if (!limit && !offset) {
      query += " LIMIT 10";
    }
    const [results] = await connection.execute(query, [id]);
    const DataToSend = results.map((result) => {
      return {
        ...result,
        profile: `${PROFILE_IMAGE_SERVING_URL}/${result.user_id}?${Date.now()}`,
      };
    });
    sendResponse(res, false, SUCCESS, DataToSend, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection?.release();
  }
};

/**
 * @description fetches all the list of users who liked the post of provided post_id
 */
const GetAllLikedByUsers = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;
    const { limit, offset } = req.query;
    let query =
      "SELECT users.id as user_id,likes.post_id as post_id,users.name, users.username  FROM likes INNER JOIN users ON likes.user_id = users.id WHERE post_id = 20 ORDER BY createdAt DESC";
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    if (offset) {
      query += ` OFFSET ${offset}`;
    }
    if (!limit && !offset) {
      query += " LIMIT 10";
    }
    const [results] = await connection.execute(query, [id]);
    const DataToSend = results.map((result) => {
      return {
        ...result,
        profile_image: `${PROFILE_IMAGE_SERVING_URL}/${
          result.user_id
        }?${Date.now()}`,
      };
    });
    sendResponse(res, false, SUCCESS, DataToSend, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection?.release();
  }
};

/**
 * @description Create a post
 *
 */
const CreatePost = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
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
    const [post] = await connection.execute(
      "SELECT posts.id,posts.user_id, users.name, users.username, posts.caption, posts.user_id, posts.createdAt, posts.updatedAt, (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likes FROM posts INNER JOIN users ON users.id = posts.user_id WHERE posts.id = ?",
      [results.insertId]
    );
    post[0].profile = `${PROFILE_IMAGE_SERVING_URL}/${id}?${Math.random()}`;
    post[0].image = `${POST_IMAGE_SERVING_URL}/${
      results.insertId
    }?${Math.random()}`;
    sendResponse(res, false, CREATED, post, CREATED_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection?.release();
  }
};

/**
 * @description Like a post
 *
 */
const LikePost = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.user;
    const post_id = req.params.id;
    const [results] = await connection.execute(
      "SELECT EXISTS(SELECT * FROM likes WHERE user_id = ? AND post_id = ?) AS already_liked",
      [id, post_id]
    );
    //if liked already remove like
    if (results[0].already_liked) {
      await connection.execute(
        "DELETE FROM `likes` WHERE `likes`.`user_id` = ? AND `likes`.`post_id` = ?",
        [id, post_id]
      );
      sendResponse(res, false, SUCCESS, -1, SUCCESS_CODE);
      return;
    }
    await connection.execute(
      "INSERT INTO likes (user_id ,post_id) VALUES (?,?)",
      [id, post_id]
    );
    sendResponse(res, false, SUCCESS, +1, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection?.release();
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
  let connection = null;
  try {
    connection = await pool.getConnection();
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
    connection?.release();
  }
};

const UpdatePostImage = async (req, res) => {
  if (!req.file) {
    sendResponse(res, true, DATA_NOT_PROVIDED, null, BAD_REQUEST_CODE);
    return;
  }

  let connection = null;
  try {
    connection = await pool.getConnection();
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
    connection?.release();
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
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;
    const [results] = await connection.execute(
      "INSERT INTO comments (user_id, post_id, comment) VALUES (?, ?, ?)",
      [req.user.id, id, req.body.comment]
    );
    if (!results.affectedRows) {
      sendResponse(res, true, NOT_FOUND, null, NOT_FOUND_CODE);
      return;
    }
    const [users] = await connection.execute(
      "SELECT name, username FROM users WHERE id = ?",
      [req.user.id]
    );
    sendResponse(
      res,
      false,
      SUCCESS,
      {
        id: results.insertId,
        comment: req.body.comment,
        createdAt: CURRENT_TIMESTAMP(),
        name: users[0].name,
        username: users[0].username,
        user_id: req.user.id,
        post_id: id,
        profile: `${PROFILE_IMAGE_SERVING_URL}/${req.user.id}?${Math.random()}`,
      },
      SUCCESS_CODE
    );
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection?.release();
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
  let connection = null;
  try {
    connection = await pool.getConnection();
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
    sendResponse(res, false, SUCCESS, req.body.comment, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection?.release();
  }
};

const DeletePost = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
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
    connection?.release();
  }
};

const DeleteComment = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
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
    connection?.release();
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
  GetHomePosts,
  GetAllLikedByUsers,
};
