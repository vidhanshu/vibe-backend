const dotenv = require("dotenv");
dotenv.config();

const BASE_URI = "https://vibe-m39i.onrender.com/";
// const BASE_URI = "http://192.168.43.35:5000/";
const DATABASE_HOST = process.env.DATABASE_HOST;
const DATABASE_USERNAME = process.env.DATABASE_USERNAME;
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
const DATABASE_NAME = process.env.DATABASE_NAME;
const JWT_SECRET = process.env.JWT_SECRET;
const PROFILE_IMAGE_SERVING_URL = `${BASE_URI}user/profile/image`;
const POST_IMAGE_SERVING_URL = `${BASE_URI}post`;
const STATUS_IMAGE_SERVING_URL = `${BASE_URI}status`;
module.exports = {
  DATABASE_HOST,
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  JWT_SECRET,
  PROFILE_IMAGE_SERVING_URL,
  POST_IMAGE_SERVING_URL,
  STATUS_IMAGE_SERVING_URL,
};
