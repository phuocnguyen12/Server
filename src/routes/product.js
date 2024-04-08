const express = require("express");
const router = express.Router();
const Controller = require("../controllers/product");
const { verifyAccessToken, isAdmin } = require("../middleware/verifyToken");
const uploader = require("../config/cloudinary.config");

router.get("/", Controller.getAllProduct);

router.put("/ratings", verifyAccessToken, Controller.ratings);

router.post(
  "/",
  [verifyAccessToken, isAdmin],
  uploader.single("images"),
  Controller.createProduct
);

router.put(
  "/:pid",
  [verifyAccessToken, isAdmin],
  uploader.single("images"),
  Controller.updateProduct
);

router.put(
  "/uploadimage/:pid",
  [verifyAccessToken, isAdmin],
  uploader.single("images"), // Use "images" as the field name
  Controller.uploadImagesProduct
);

router.delete("/:pid", [verifyAccessToken, isAdmin], Controller.deleteProduct);

router.get("/:pid", Controller.getProduct);

module.exports = router;
