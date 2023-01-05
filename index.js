const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const { PORT } = require("./src/configs/constants.js");
const { AUTH, USER, POST, CHAT, STATUS } = require("./src/configs/routes.js");
const AuthRoute = require("./src/routes/auth.js");
const UserRoute = require("./src/routes/user.js");
const PostRoute = require("./src/routes/post.js");
const ChatRoute = require("./src/routes/chat.js");
const StatusRouter = require("./src/routes/status.js");

const app = express();

//middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//routes
app.use(AUTH, AuthRoute);
app.use(USER, UserRoute);
app.use(POST, PostRoute);
app.use(CHAT, ChatRoute);
app.use(STATUS, StatusRouter);

app.get("/", (req, res) => {
  res.status(200).send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
