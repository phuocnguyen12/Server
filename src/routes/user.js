const express = require("express");
const router = express.Router();
const Controller = require("../controllers/user");
const { verifyAccessToken, isAdmin } = require("../middleware/verifyToken");
const uploader = require("../config/cloudinary.config");

router.post("/register", Controller.register);

router.post("/login", Controller.login);

module.exports = router;