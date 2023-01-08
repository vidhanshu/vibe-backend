const {
  CreateUser,
  DeleteUser,
  LoginUser,
  LogoutAllUser,
  LogoutUser,
} = require("../controllers/auth.js");
const auth = require("../middlewares/auth.js");
const { Router } = require("express");

const AuthRouter = Router();

AuthRouter.post("/signup", CreateUser);
AuthRouter.post("/login", LoginUser);
AuthRouter.post("/logout", auth, LogoutUser);
AuthRouter.post("/logoutall", auth, LogoutAllUser);
AuthRouter.delete("/delete", auth, DeleteUser);

module.exports = AuthRouter;
