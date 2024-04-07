const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middleware/jwt");
const jwt = require("jsonwebtoken");
// const sendMail = require("../ultils/sendMail");
const crypto = require("crypto");

const register = asyncHandler(async (req, res) => {
    const { email, password, firstname, lastname, mobile } = req.body;
    if (!email || !password || !lastname || !firstname || !mobile)
      return res.status(400).json({
        success: false,
        message: "Missing inputs",
      });
  
    const user = await User.findOne({ email });
    if (user) throw new Error("User has existed");
    else {
      const newUser = await User.create(req.body);
      return res.status(200).json({
        success: newUser ? true : false,
        message: newUser
          ? "Register is successfully. Please go login~"
          : "Something went wrong",
      });
    }
  });

  const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing inputs",
      });
    }
  
    const response = await User.findOne({ email: email });
    if (response && (await response.isCorrectPassword(password))) {
      const { password, role, refreshToken, ...userData } = response.toObject();
      const accessToken = generateAccessToken(response._id, role);
      const newRefreshToken = generateRefreshToken(response._id);
  
      // Save RT to DB
      await User.findByIdAndUpdate(
        response._id,
        { refreshToken: newRefreshToken },
        { new: true }
      );
  
      // Save RT to cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.status(200).json({
        success: true,
        message: "Success!",
        accessToken,
        userData,
      });
    } else {
      throw new Error("Wrong input");
    }
  });

  module.exports = {
    register,
    login,
  };

