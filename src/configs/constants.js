const PORT = 5000;
const DATABASE_CONCURRENT_CONNECTIONS = 1000000000;

const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const USERNAME_REGEX = /[A-Za-z][A-Za-z0-9_]{7,29}$/;

const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

const PROFILE_IMAGE_RESIZE_VALUE = 320;
const POST_IMAGE_RESIZE_VALUE_WIDTH = 500;
const POST_IMAGE_RESIZE_VALUE_HEIGHT = 500;
const STATUS_IMAGE_RESIZE_VALUE = 400;
module.exports = {
  PORT,
  DATABASE_CONCURRENT_CONNECTIONS,
  EMAIL_REGEX,
  USERNAME_REGEX,
  PASSWORD_REGEX,
  PROFILE_IMAGE_RESIZE_VALUE,
  POST_IMAGE_RESIZE_VALUE_WIDTH,
  POST_IMAGE_RESIZE_VALUE_HEIGHT,
  STATUS_IMAGE_RESIZE_VALUE,
};
