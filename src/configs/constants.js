const PORT = 5000;
const DATABASE_CONCURRENT_CONNECTIONS = 1000000000;

const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const USERNAME_REGEX = /[A-Za-z][A-Za-z0-9_]{7,29}$/;

const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

module.exports = {
  PORT,
  DATABASE_CONCURRENT_CONNECTIONS,
  EMAIL_REGEX,
  USERNAME_REGEX,
  PASSWORD_REGEX,
};
