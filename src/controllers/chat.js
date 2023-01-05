const { sendResponse } = require("../utils/sendResponse");
const {
  BAD_REQUEST,
  BAD_REQUEST_CODE,
  SUCCESS_CODE,
  INTERNAL_ERROR,
  INTERNAL_ERROR_CODE,
  SUCCESS,
  UNAUTHORIZED,
  UNAUTHORIZED_CODE,
} = require("../configs/response");
const { PROFILE_IMAGE_SERVING_URL } = require("../configs/env");
const pool = require("../pool");
const { CURRENT_TIMESTAMP } = require("../utils/utils");

const GetAllMessages = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id: sender_id } = req.user;
    const { chat_id, reciever_id } = req.params;
    if (!reciever_id || !chat_id) {
      sendResponse(res, true, "INVALID PARAMETERS", null, BAD_REQUEST_CODE);
      return;
    }
    //to check if the user is actually a part of chat =, cz if he is not the part of chat he can't be provided with the chat of that chat_Id
    const [results] = await connection.execute(
      "SELECT EXISTS(SELECT * FROM chats WHERE (participant_1 = ? AND participant_2 = ?) OR (participant_1 = ? AND participant_2 = ?) AND id = ?) AS is_user_part_of_chat",
      [sender_id, reciever_id, reciever_id, sender_id, chat_id]
    );
    //user is not part of chat for which he is requesting
    if (!results[0].is_user_part_of_chat) {
      sendResponse(
        res,
        true,
        UNAUTHORIZED,
        "You cannot see this chat",
        UNAUTHORIZED_CODE
      );
      return;
    }
    //joining user and messages
    const [messages] = await connection.execute(
      "SELECT messages.message, sender.username AS sender_name, reciever.username AS reciever_name, messages.sentAt AS sentAt, sender.id AS sender_id, reciever.id AS reciever_id FROM messages INNER JOIN users AS reciever ON messages.reciever = reciever.id INNER JOIN users AS sender ON messages.sender = sender.id WHERE chat_id = ?;",
      [chat_id]
    );
    const MessagesToBeSent = messages.map((message) => {
      return {
        ...message,
        sender_profile: `${PROFILE_IMAGE_SERVING_URL}/${message.sender_id}`,
        reciever_profile: `${PROFILE_IMAGE_SERVING_URL}/${message.reciever_id}`,
      };
    });
    sendResponse(res, false, SUCCESS, MessagesToBeSent, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection.release();
  }
};
/**
 * @description Send message to a chata
 * @assumptions I'm assuming that the chat_id won't be alphabetic and will never be a 0 or a negative number
 * @param {null | number > 1 | undefined} chat_id - the chat id which cannot be < 1 && cannot be alphabetic && cannot be 0
 * @param {null | number > 1 | undefined} reciever_id - the reciever id which cannot be < 1 && cannot be alphabetic && cannot be 0
 * @returns message and emits socket events
 */
const SendMessage = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { message } = req.body;
    if (!message) {
      sendResponse(
        res,
        true,
        BAD_REQUEST,
        "Message is required",
        BAD_REQUEST_CODE
      );
      return;
    }
    const { chat_id, reciever_id } = req.params;
    const { id: sender_id } = req.user;
    //checking if the chat_id is null or undefined
    if (chat_id === "null" || chat_id === "undefined") {
      const [results] = await connection.execute(
        "SELECT EXISTS(SELECT * FROM chats WHERE (participant_1 = ? AND participant_2 = ?) OR (participant_1 = ? AND participant_2 = ?)) AS chat_exists",
        [sender_id, reciever_id, reciever_id, sender_id]
      );
      if (results[0].chat_exists) {
        sendResponse(
          res,
          true,
          BAD_REQUEST,
          "Chat already exists & hence you must provide the chat id",
          BAD_REQUEST_CODE
        );
        return;
      }
      //this is a new message so create chat
      const [chats] = await connection.execute(
        "INSERT INTO chats (participant_1, participant_2, last_message) VALUES (?, ?, ?)",
        [sender_id, reciever_id, message]
      );
      if (!chats.affectedRows) {
        sendResponse(
          res,
          true,
          INTERNAL_ERROR,
          "Chat couldn't be created",
          INTERNAL_ERROR_CODE
        );
        return;
      }
      const [messages] = await connection.execute(
        "INSERT INTO messages (chat_id, sender, reciever, message) VALUES (?, ?, ?, ?)",
        [chats.insertId, sender_id, reciever_id, message]
      );
      if (!messages.insertId) {
        sendResponse(
          res,
          true,
          INTERNAL_ERROR,
          "Message couldn't be sent",
          INTERNAL_ERROR_CODE
        );
        return;
      }
      const messageToBeSent = {
        id: messages.insertId,
        message,
        sentAt: CURRENT_TIMESTAMP(),
        sender: sender_id,
        reciever: reciever_id,
        chat_id: chats.insertId,
      };
      sendResponse(res, false, SUCCESS, messageToBeSent, SUCCESS_CODE);
      //TODO: socket.io stuff
      return; //returning bcz it was a first message
    }
    //it is not a first message----------------------------
    //checking if the provided chat id exists or not
    const [results] = await connection.execute(
      "SELECT * from chats WHERE id = ? AND (participant_1 = ? AND participant_2 = ?) OR (participant_1 = ? AND participant_2 = ?)",
      [chat_id, sender_id, reciever_id, reciever_id, sender_id]
    );
    if (results.length === 0) {
      sendResponse(
        res,
        true,
        BAD_REQUEST,
        "Chat doesn't exist",
        BAD_REQUEST_CODE
      );
      return;
    }
    //if chat exists - update the details
    const [chats] = await connection.execute(
      "UPDATE chats SET last_message = ?, participant_1 = ?, participant_2 = ?, last_message_timestamp = ?",
      [message, sender_id, reciever_id, CURRENT_TIMESTAMP()]
    );
    if (!chats.affectedRows) {
      sendResponse(
        res,
        true,
        INTERNAL_ERROR,
        "Chat couldn't be created",
        INTERNAL_ERROR_CODE
      );
      return;
    }
    //store message
    const [messages] = await connection.execute(
      "INSERT INTO messages (sender, reciever, message, chat_id) VALUES(?, ?, ?, ?)",
      [sender_id, reciever_id, message, chat_id]
    );
    if (!messages.insertId) {
      sendResponse(
        res,
        true,
        INTERNAL_ERROR,
        "Message couldn't be sent",
        INTERNAL_ERROR_CODE
      );
      return;
    }
    const messageToBeSent = {
      id: messages.insertId,
      message,
      sentAt: CURRENT_TIMESTAMP(),
      sender: sender_id,
      reciever: reciever_id,
      chat_id,
    };
    //temporarily sending message directly
    sendResponse(res, false, SUCCESS, messageToBeSent, SUCCESS_CODE);
    //TODO: socket.io stuff
  } catch (error) {
    console.log(error);
    sendResponse(res, true, BAD_REQUEST, null, BAD_REQUEST_CODE);
  } finally {
    connection.release();
  }
};

module.exports = {
  SendMessage,
  GetAllMessages,
};
