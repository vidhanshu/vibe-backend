const {
  CreateUser,
  DeleteUser,
  LoginUser,
  LogoutAllUser,
  LogoutUser,
} = require("../controllers/auth");

const { Router } = require("express");

const AuthRouter = Router();

AuthRouter.post("/signup", CreateUser);
AuthRouter.post("/login", LoginUser);
AuthRouter.post("/logout", LogoutUser);
AuthRouter.post("/logoutall", LogoutAllUser);
AuthRouter.delete("/delete", DeleteUser);

module.exports = AuthRouter;
