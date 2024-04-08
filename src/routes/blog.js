const express = require("express");
const router = express.Router();
const Controller = require("../controllers/blog");
const { verifyAccessToken, isAdmin } = require("../middleware/verifyToken");
const uploader = require("../config/cloudinary.config");

router.post("/", [verifyAccessToken, isAdmin], Controller.createBlog);

router.get("/all", Controller.getBlogs);

router.get("/one/:bid", Controller.getBlog);

router.delete("/:bid", [verifyAccessToken, isAdmin], Controller.deleteBlog);

router.put("/like/:bid", verifyAccessToken, Controller.likeBlog);

router.put("/dislike/:bid", verifyAccessToken, Controller.dislikeBlog);

router.put("/:bid", [verifyAccessToken, isAdmin], Controller.updateBlog);

router.put(
  "/image/:bid",
  [verifyAccessToken, isAdmin],
  uploader.single("image"),
  Controller.uploadImageBlog
);

module.exports = router;
