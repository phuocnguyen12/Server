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

const getCurrent = asyncHandler(async (req, res) => {
  const _id = req.user;

  const user = await User.findById(_id)
    .select("-password  -refreshToken")
    .populate({
      path: "cart",
      populate: {
        path: "product",
        select: "title images price",
      },
    });

  return res.status(200).json({
    success: user ? true : false,
    response: user ? user : "User not found",
  });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //get token from cookies
  const cookie = req.cookies;

  //check have token?
  if (!cookie && !cookie.refreshToken) {
    throw new Error("No have refresh token in cookies");
  }

  //check token is valid?
  const results = jwt.verify(cookie.refreshToken, process.env.JWT_SECRET);

  const response = await User.findOne({
    _id: results._id,
    refreshToken: cookie.refreshToken,
  });

  return res.status(200).json({
    success: response ? true : false,
    newAccessToken: response
      ? generateAccessToken(response._id, response.role)
      : "Refresh Token",
  });
});

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;

  if (!cookie || !cookie.refreshToken) {
    throw new Error("Not have refresh Token in cookie");
  }

  //remove rf on db
  await User.findOneAndUpdate(
    { refreshToken: cookie.refreshToken },
    { refreshToken: "" },
    { new: true }
  );

  //remove rf in cookie
  res.clearCookie("refreshToken", { httpOnly: true, secure: true });

  return res.status(200).json({
    success: true,
    message: "Logout done",
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) {
    throw new Error("Missing email");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error(`User with ${email} not found`);
  }

  const resetToken = user.createPasswordChangedToken();
  await user.save();

  const html = `Click link to change password, please. This link will expire after 15 minutes from now. <a href=${process.env.URL_SERVER}/user/reset-password/${resetToken}>Click here</a>`;

  const data = {
    email,
    html,
  };

  // const result = await sendMail(data);

  return res.status(200).json({
    success: true,
    result,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password, token } = req.body;
  if (!password || !token) {
    throw new Error("Missing Input");
  }

  const passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    throw new Error("Invalid reset token");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordChangedAt = Date.now();
  user.passwordResetExpires = undefined;
  await user.save();

  return res.status(200).json({
    success: user ? true : false,
    message: user ? "Updated password" : "Something went wrong",
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const queries = { ...req.query };
  const excludeFields = ["limit", "sort", "page", "fields"];
  excludeFields.forEach((el) => delete queries[el]);

  let queryString = JSON.stringify(queries);
  queryString = queryString.replace(
    /\b(gte|gt|lt|lte)\b/g,
    (macthedEl) => `$${macthedEl}`
  );
  const formatedQueries = JSON.parse(queryString);

  //Filtering
  if (queries?.name) {
    formatedQueries.name = { $regex: queries.name, $options: "i" };
  }
  if (req.query.q) {
    delete formatedQueries.q;
    formatedQueries["$or"] = [
      { firstname: { $regex: req.query.q, $options: "i" } },
      { lastname: { $regex: req.query.q, $options: "i" } },
      { email: { $regex: req.query.q, $options: "i" } },
    ];
  }
  let queryCommand = User.find(formatedQueries);

  //Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    queryCommand = queryCommand.sort(sortBy);
  }

  //Fields limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    queryCommand = queryCommand.select(fields);
  }

  //Pagination
  const page = +req.query.page || 1;
  const limit = +req.query.limit || process.env.LIMIT_PRODUCTS;
  const skip = (page - 1) * limit;
  queryCommand.skip(skip).limit(limit);
  try {
    const response = await queryCommand.exec();
    const counts = await User.find(formatedQueries).countDocuments();
    //  const response = await User.find().select("-password -role -refreshToken");

    return res.status(200).json({
      success: response ? true : false,
      counts,
      users: response ? response : "Cannot get all Users",
    });
  } catch (err) {
    // Handle any errors that occur during the query or counting
    return res.status(500).json({ success: false, error: err.message });
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  const { uid } = req.params;

  const response = await User.findByIdAndDelete(uid);

  return res.status(200).json({
    success: response ? true : false,
    mes: response
      ? `User with email: ${response.email} deleted`
      : "No user delete",
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { firstname, lastname, email, mobile } = req.body;
  const data = { firstname, lastname, email, mobile };
  if (req.file) {
    data.avatar = req.file.path;
  }
  if (!_id || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Something went wrong",
    });
  }
  const response = await User.findByIdAndUpdate(_id, data, {
    new: true,
  }).select("-password -role -refreshToken");

  return res.status(200).json({
    success: response ? true : false,
    mes: response ? "Updated" : "Update fail",
  });
});

const updateUserByAdmin = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Missing Input",
    });
  }
  const response = await User.findByIdAndUpdate(uid, req.body, {
    new: true,
  }).select("-password -role -refreshToken");

  return res.status(200).json({
    success: response ? true : false,
    mes: response ? "Updated" : "Update fail",
  });
});

const updateUserAddress = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!req.body.address) {
    return res.status(400).json({
      success: false,
      message: "Missing Input",
    });
  }
  const response = await User.findByIdAndUpdate(
    _id,
    { $push: { address: req.body.address } },
    {
      new: true,
    }
  ).select("-password -role -refreshToken");

  return res.status(200).json({
    success: response ? true : false,
    updateStatus: response ? response : "Update fail",
  });
});

const updateCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { pid, quantity = 1 } = req.body;
  if (!pid || !quantity) {
    return res.status(200).json({
      success: false,
      message: "Missing Input",
    });
  }
  const user = await User.findById(_id).select("cart");
  const alreadyProduct = user?.cart?.find(
    (el) => el.product.toString() === pid
  );

  if (alreadyProduct) {
    const response = await User.updateOne(
      { cart: { $elemMatch: alreadyProduct } },
      { $set: { "cart.$.quantity": quantity } },
      { new: true }
    );

    return res.status(200).json({
      success: response ? true : false,
      mes: response ? "Updated" : "Update fail",
    });
  } else {
    const response = await User.findByIdAndUpdate(
      _id,
      { $push: { cart: { product: pid, quantity } } },
      { new: true }
    );

    return res.status(200).json({
      success: response ? true : false,
      mes: response ? "Updated" : "Update fail",
    });
  }
});

const removeProductInCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { pid } = req.params;
  const user = await User.findById(_id).select("cart");
  const alreadyProduct = user?.cart?.find(
    (el) => el.product.toString() === pid
  );

  if (!alreadyProduct) {
    return res.status(200).json({
      success: true,
      mes: "Updated",
    });
  }

  const response = await User.findByIdAndUpdate(
    _id,
    { $pull: { cart: { product: pid } } },
    { new: true }
  );

  return res.status(200).json({
    success: response ? true : false,
    mes: response ? "Updated" : "Update fail",
  });
});

module.exports = {
  register,
  login,
  getCurrent,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  getAllUsers,
  deleteUser,
  updateUser,
  updateUserByAdmin,
  updateUserAddress,
  updateCart,
  removeProductInCart,
};
