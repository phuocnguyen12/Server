const express = require("express");
const router = express.Router();
const Controller = require("../controllers/coupon");
const { verifyAccessToken, isAdmin } = require("../middleware/verifyToken");

router.post("/", [verifyAccessToken, isAdmin], Controller.createNewCoupon);

router.get("/", verifyAccessToken, Controller.getCoupon);

router.put("/:cid", [verifyAccessToken, isAdmin], Controller.updateCoupon);

router.delete("/:cid", [verifyAccessToken, isAdmin], Controller.deleteCoupon);

module.exports = router;
