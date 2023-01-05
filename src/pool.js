const mysql = require("mysql2/promise");
const {
  DATABASE_HOST,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  DATABASE_USERNAME,
} = require("./configs/env");
const { DATABASE_CONCURRENT_CONNECTIONS } = require("./configs/constants");

const pool = mysql.createPool({
  host: DATABASE_HOST,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  user: DATABASE_USERNAME,
  connectionLimit: DATABASE_CONCURRENT_CONNECTIONS,
});

module.exports = pool;
