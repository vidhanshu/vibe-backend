const { Router } = require("express");
const auth = require("../middlewares/auth");
const multer = require("multer");
const {
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
} = require("../controllers/post");
//multer stuff
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpeg" ||
      (file.mimetype === "image/jpg" && file.size > 5000000)
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(
        new Error("Only .png, .jpg and .jpeg format allowed & size <= 5000000!")
      );
    }
  },
});

const PostRoute = Router();
PostRoute.get("/:id", GetPostImage);
/**
 * @author @vidhanshu
 * get: /post/user/{id}:
 * description: Get all posts of a user
 * @param : id of user
 * @query : limit and offset
 */
PostRoute.get("/user/:id", GetPosts);
/**
 * @author @vidhanshu
 * get: /
 * description: Get all posts for home screens only first 10 by def
 * @param : id of user
 * @query : limit and offset
 */
PostRoute.get("/", auth, GetHomePosts);

/**
 * @author @vidhanshu
 * get: /post/{id}/comments:
 * description: Get all comments of a post
 * @param : id of post
 * @query : limit and offset
 */
PostRoute.get("/:id/comments", GetAllComments);

/**
 * @author @vidhanshu
 * get: /post/{id}/comments:
 * description: get all user who liked the particulr post
 * @param : id of post
 * @query : limit and offset
 *
 */

PostRoute.get("/:id/likedby/users", GetAllLikedByUsers);

/**
 * @author @vidhanshu
 * post: /post/create:
 * description: Create a post
 * @param : image
 * @body : caption
 */
PostRoute.post("/create", auth, upload.single("image"), CreatePost);
/**
 * @author @vidhanshu
 * post: /post/{id}/comment:
 * description: Comment on a post
 * @param : id of post
 */
PostRoute.post("/:id/comment", auth, Comment);

/**
 * @author @vidhanshu
 * patch: /post/like/{id}:
 * description: Like and Unlike a post
 * @param : id of post
 */
PostRoute.post("/:id/like", auth, LikePost);
/**
 * @author @vidhanshu
 * patch: /post/caption/{id}:
 * description: Update caption of a post
 * @param : id of post
 * @body : caption
 */
PostRoute.patch("/:id/caption/", auth, UpdateCaption);
/**
 * @author @vidhanshu
 * patch: /post/image/{id}:
 * description: Update image of a post
 * @param : id of post
 * @body : image
 */
PostRoute.patch("/:id/image", auth, upload.single("image"), UpdatePostImage);
/**
 * @author @vidhanshu
 * patch: /post/update/comment/{id}:
 * description: Update comment of a post
 * @param : id of comment
 * @body : comment
 */
PostRoute.patch("/comment/:id", auth, UpdateComment);

/**
 * @author @vidhanshu
 * patch: /post/delete/comment/{id}:
 * description: delete comment of a post
 * @param : id of comment
 */
PostRoute.delete("/comment/:id", auth, DeleteComment);
/**
 * @author @vidhanshu
 * patch: /post/{id}/delete:
 * description: delete post
 * @param : id of post
 */
PostRoute.delete("/:id", auth, DeletePost);
module.exports = PostRoute;
