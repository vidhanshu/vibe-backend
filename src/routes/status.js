const { Router } = require("express");
const { AddStatus, RemoveStatus, GetStatus } = require("../controllers/status");
const auth = require("../middlewares/auth");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, callback) => {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/jpg" ||
      (file.mimetype === "image/png" && file.size <= 2000000)
    ) {
      callback(null, true);
      return;
    }
    cb(null, false);
    return cb(
      new Error("Only .png, .jpg and .jpeg format allowed & size <= 2000000!")
    );
  },
});
const StatusRouter = Router();

StatusRouter.post("/:id", GetStatus);
StatusRouter.post("/create", auth, upload.single("image"), AddStatus);
StatusRouter.delete("/delete", auth, RemoveStatus);

module.exports = StatusRouter;
