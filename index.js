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
//creating socket server
const server = require("http").Server(app);
const io = require("socket.io")(server);

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

server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});

// socket.io stuff
const LIST_OF_ROOMS = [];
io.on("connection", (socket) => {
  //when somebody go on chat screen in frontend
  socket.on("privateChatRequest", (data) => {
    console.log(data)
    //data contains senderId and receiverId
    const { senderId, receiverId } = data;
    //check if room already exists
    let roomName = LIST_OF_ROOMS.find(
      (room) => room === senderId + "-" + receiverId
    );
    if (!roomName) {
      //check if room exists in reverse order
      roomName = LIST_OF_ROOMS.find(
        (room) => room === receiverId + "-" + senderId
      );
    }
    //if room doesn't exist then create a new room
    if (!roomName) {
      roomName = senderId + "-" + receiverId;
      LIST_OF_ROOMS.push(roomName);
    }
    //join the room
    socket.join(roomName);
    socket.on("privateChatMessage", (messageData) => {
      socket.to(roomName).emit("privateChatMessage", messageData);
    });
    socket.disconnect((e) => console.log("disconnected", e));
  });
});
// const CONNECTED = [];
// io.on("connection", (socket) => {
//   const userId = socket.handshake.query.userId;
//   if (userId) {
//     CONNECTED.push(userId);
//     console.log(CONNECTED);
//     socket.join(userId);
//   }
//   console.log("connected", userId);
//   //when somebody go on chat screen in frontend
//   socket.on("privateChatRequest", (data) => {
//     //data contains senderId and receiverId
//     const { receiverId } = data;
//     console.log("privateChatRequest", data);
//     socket.on("privateChatMessage", (messageData) => {
//       console.log("privateChatMessage", messageData);
//       io.to(receiverId).emit("privateChatMessage", messageData);
//     });
//   });
// });

module.exports = io;
