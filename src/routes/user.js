const {
  GetProfile,
  UpdateBio,
  UpdateEmail,
  UpdateMobile,
  UpdateName,
  UpdatePassword,
  UpdateProfile,
  UpdateUsername,
} = require("../controllers/user");

const { Router } = require("express");

const UserRouter = Router();

UserRouter.get("/profile/:id", GetProfile);
UserRouter.patch("/update", UpdateProfile);
UserRouter.patch("/update/name", UpdateName);
UserRouter.patch("/update/username", UpdateUsername);
UserRouter.patch("/update/email", UpdateEmail);
UserRouter.patch("/update/mobile", UpdateMobile);
UserRouter.patch("/update/bio", UpdateBio);
UserRouter.patch("/update/password", UpdatePassword);

module.exports = UserRouter;
