const { Router } = require("express");
const {
  SendMessage,
  GetAllMessages,
  GetChatRecents,
} = require("../controllers/chat");
const ChatRouter = Router();
const auth = require("../middlewares/auth");

ChatRouter.get("/:chat_id/messages/:reciever_id", auth, GetAllMessages);
ChatRouter.get("/recents", auth, GetChatRecents);
/**
 * @route post : /chat/chat_id/message/reciever_id
 */
ChatRouter.post("/:chat_id/message/:reciever_id", auth, SendMessage);
/**
 *
 */

module.exports = ChatRouter;
