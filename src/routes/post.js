const { Router } = require("express");

const PostRoute = Router();

PostRoute.get("/", (req, res) => {
  res.status(200).send("Hello World");
});

module.exports = PostRoute;
