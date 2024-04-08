const express = require("express");
const router = express.Router();
const Controller = require("../controllers/productCategory");
const { verifyAccessToken, isAdmin } = require("../middleware/verifyToken");

router.get("/", Controller.getAllCategory);

router.post("/", [verifyAccessToken, isAdmin], Controller.createCategory);

router.put("/:pcid", [verifyAccessToken, isAdmin], Controller.updateCategory);

router.delete(
  "/:pcid",
  [verifyAccessToken, isAdmin],
  Controller.deleteCategory
);

module.exports = router;
