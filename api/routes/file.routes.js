// routes/file.routes.js
const express = require("express");
const { protect } = require("../middlewares/auth");
const {
  uploadFile,
  getFile,
  downloadFile,
  deleteFile,
  getUserFiles,
  getFilesByFolderId
} = require("../controllers/fileController");

const router = express.Router();

router.use(protect);

router.route("/:id")
  .get(getFile)
  .delete(deleteFile);

module.exports = router;