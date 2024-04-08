const express = require("express");
const router = express.Router();
const Controller = require("../controllers/order");
const { verifyAccessToken, isAdmin } = require("../middleware/verifyToken");

router.post("/", verifyAccessToken, Controller.createOrder);

router.get("/", verifyAccessToken, Controller.getUserOrder);

router.get("/all", [verifyAccessToken, isAdmin], Controller.getAllOrder);

router.put(
  "/status/:oid",
  [verifyAccessToken, isAdmin],
  Controller.updateStatus
);

module.exports = router;
