// routes/pdf.routes.js
const express = require("express");
const { protect } = require("../middlewares/auth");
const {
  createFolder,
  getFolders,
  getFolderFiles,
  deleteFolder
} = require("../controllers/folderController");

const router = express.Router();

router.route("/:folderId")
  .get(getFolderFiles)
  .delete(protect, deleteFolder);

router.route("/")
  .post(protect, createFolder);

router.route("/:projectId/project")
  .get(getFolders);

module.exports = router;