const {
  GetProfile,
  UpdateBio,
  UpdateEmail,
  UpdateMobile,
  UpdateName,
  UpdatePassword,
  UpdateProfile,
  UpdateUsername,
  GetProfileImage,
  FollowUser,
  GetFollowers,
  SearchUserByUserNameOrName,
} = require("../controllers/user");

const { Router } = require("express");
const auth = require("../middlewares/auth");
const multer = require("multer");
const follower = require("../middlewares/follower");

const UserRouter = Router();
//multer stuff
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
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

UserRouter.get("/profile/:id", GetProfile);
UserRouter.get("/profile/image/:id", GetProfileImage);
UserRouter.get("/search", SearchUserByUserNameOrName);
UserRouter.get("/:id/user/followers/all", auth, follower, GetFollowers);

UserRouter.patch(
  "/update/image",
  auth,
  upload.single("image"),
  UpdateProfile,
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

UserRouter.post("/:id/follow", auth, FollowUser);
UserRouter.patch("/update/name", auth, UpdateName);
UserRouter.patch("/update/username", auth, UpdateUsername);
UserRouter.patch("/update/email", auth, UpdateEmail);
UserRouter.patch("/update/mobile", auth, UpdateMobile);
UserRouter.patch("/update/bio", auth, UpdateBio);
UserRouter.patch("/update/password", auth, UpdatePassword);

module.exports = UserRouter;
