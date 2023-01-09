const { STATUS_IMAGE_RESIZE_VALUE } = require("../configs/constants.js");
const cron = require("node-cron");

const { sendResponse } = require("../utils/SendResponse.js");
const {
  BAD_REQUEST_CODE,
  INTERNAL_ERROR,
  INTERNAL_ERROR_CODE,
  DATA_NOT_PROVIDED,
  SUCCESS,
  SUCCESS_CODE,
} = require("../configs/response.js");
const sharp = require("sharp");
const { TIMESTAMP_AFTER_SPECIFIC_MINS } = require("../utils/utils.js");
const pool = require("../pool.js");
const {
  STATUS_IMAGE_SERVING_URL,
  PROFILE_IMAGE_SERVING_URL,
} = require("../configs/env.js");

const GetStatus = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;
    const [rows] = await connection.execute(
      "SELECT image FROM statuses WHERE user_id = ?",
      [id]
    );
    if (rows.length === 0) {
      sendResponse(res, false, SUCCESS, null, SUCCESS_CODE);
      return;
    }
    res.set("Content-Type", "image/png");
    res.send(rows[0].image);
  } catch (error) {
    console.log(error);
    sendResponse(res, false, SUCCESS, null, SUCCESS_CODE);
  } finally {
    connection?.release();
  }
};

const GetHomeStatuses = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { limit, offset } = req.query;
    let query =
      "SELECT statuses.id, users.name, users.username, users.id as user_id, statuses.createdAt FROM statuses INNER JOIN users ON statuses.user_id = users.id";
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    if (offset) {
      query += ` OFFSET ${offset}`;
    }
    if (!limit && !offset) {
      query += " LIMIT 10";
    }
    const [rows] = await connection.execute(query);
    const DataToBeSent = rows.map((row) => {
      return {
        ...row,
        status: `${STATUS_IMAGE_SERVING_URL}/${row.user_id}?${Math.random()}`,
        profile: `${PROFILE_IMAGE_SERVING_URL}/${row.user_id}?${Math.random()}`,
      };
    });
    sendResponse(res, false, SUCCESS, DataToBeSent, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, false, SUCCESS, null, SUCCESS_CODE);
  } finally {
    connection?.release();
  }
};

const AddStatus = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { file } = req;
    if (!file) {
      sendResponse(res, true, DATA_NOT_PROVIDED, null, BAD_REQUEST_CODE);
      return;
    }
    const PNG = await sharp(req.file.buffer)
      .resize(STATUS_IMAGE_RESIZE_VALUE, STATUS_IMAGE_RESIZE_VALUE)
      .toFormat("png")
      .toBuffer();
    const [statuses] = await connection.execute(
      "SELECT EXISTS(SELECT * FROM statuses WHERE user_id = ?) As isStatusExists",
      [req.user.id]
    );

    if (statuses[0].isStatusExists) {
      await connection.execute(
        "UPDATE statuses SET image = ? WHERE user_id = ?",
        [PNG, req.user.id]
      );
      sendResponse(res, false, SUCCESS, null, SUCCESS_CODE);
      return;
    }

    await connection.execute(
      "INSERT INTO statuses (image, expiresAt, user_id) VALUES (?, ?, ?)",
      [PNG, TIMESTAMP_AFTER_SPECIFIC_MINS(24 * 60), req.user.id]
    );
    /**
     * @description scheduling the cron job to run every midnight once and delete all statuses whose expiresAt is older than current time
     * @doubt -> one more doubt as i have created the cron job inside the express rounde handler will the multiple cron jobs will be created on every req?
     * @solution -> No, creating the cron job inside an express route handler will not create multiple instances of the cron job. The cron job will only be created once, when the code that defines it is executed. Each time the route is accessed, the code inside the route handler will be executed, but the cron job itself will not be re-created. It will continue to run according to the schedule that you have defined, regardless of how many times the route is accessed.
     */
    cron.schedule("0 0 * * *", async () => {
      // Delete images that have expired
      const connection_for_cron_job = await pool.getConnection();
      try {
        console.log("RUNNING AFTER EVERY 24 hrs");
        connection_for_cron_job.execute(
          "DELETE FROM statuses WHERE expiresAt < NOW()"
        );
      } catch (error) {
        console.log(error);
      } finally {
        connection_for_cron_job.release();
      }
    });
    sendResponse(res, false, SUCCESS, null, SUCCESS_CODE);
  } catch (error) {
    console.log(error);
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection?.release();
  }
};

const RemoveStatus = async (req, res) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = req.user;
    await connection.execute("DELETE FROM statuses WHERE user_id = ?", [id]);
    sendResponse(res, false, SUCCESS, null, SUCCESS_CODE);
  } catch (error) {
    sendResponse(res, true, INTERNAL_ERROR, null, INTERNAL_ERROR_CODE);
  } finally {
    connection?.release();
  }
};

module.exports = {
  AddStatus,
  RemoveStatus,
  GetStatus,
  GetHomeStatuses,
};
