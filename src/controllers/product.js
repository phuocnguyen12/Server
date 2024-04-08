const Product = require("../models/product");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");

const createProduct = asyncHandler(async (req, res) => {
  const { title, price, description, category } = req.body;
  const images = req?.file?.images[0].path;

  if (!(title && price && description && category)) {
    throw new Error("Missing input");
  }

  req.body.slug = slugify(title);

  if (images) req.body.images = images;

  const newProduct = await Product.create(req.body);

  return res.status(200).json({
    success: newProduct ? true : false,
    createdProductStatus: newProduct
      ? newProduct
      : "Can not create new product!",
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const product = await Product.findById(pid);

  return res.status(200).json({
    success: product ? true : false,
    productData: product ? product : "Can not get product!",
  });
});

const getAllProduct = asyncHandler(async (req, res) => {
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
  if (queries?.title) {
    formatedQueries.title = { $regex: queries.title, $options: "i" };
  }
  if (req.query.q) {
    delete formatedQueries.q;
    formatedQueries["$or"] = [
      { title: { $regex: req.query.q, $options: "i" } },
    ];
  }
  let queryCommand = Product.find(formatedQueries);

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
    const counts = await Product.find(formatedQueries).countDocuments();
    //  const response = await User.find().select("-password -role -refreshToken");

    return res.status(200).json({
      success: response ? true : false,
      counts,
      products: response ? response : "Cannot get all Products",
    });
  } catch (err) {
    // Handle any errors that occur during the query or counting
    return res.status(500).json({ success: false, error: err.message });
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  // const file = req?.file;
  const { title, price, category, quantity, description } = req.body;
  const data = { title, price, category, quantity, description };
  if (req.file) {
    data.images = req.file.path;
  }

  // if (file.images) {
  //   req.body.images = file?.images[0].path;
  // }

  // if (req.body && req.body.title) {
  //   req.body.slug = slugify(req.body.title);
  // }
  const updatedProduct = await Product.findByIdAndUpdate(pid, data, {
    new: true,
  });

  return res.status(200).json({
    success: updatedProduct ? true : false,
    updatedProductStatus: updatedProduct
      ? updatedProduct
      : "Can not update product!",
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const deletedProduct = await Product.findByIdAndDelete(pid);

  return res.status(200).json({
    success: deletedProduct ? true : false,
    deletedProductStatus: deletedProduct
      ? "Success"
      : "Can not delete product!",
  });
});

const ratings = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { star, comment, pid } = req.body;

  if (!star || !pid) {
    return res.status(400).json("Missing Input");
  }

  const ratingProduct = await Product.findById(pid);
  const alreadyRating = ratingProduct?.ratings?.find(
    (el) => el.postedBy.toString() === _id
  );

  if ({ alreadyRating }) {
    await Product.updateOne(
      {
        ratings: { $elemMatch: alreadyRating },
      },
      {
        $set: { "ratings.$.star": star, "ratings.$.comment": comment },
      },
      { new: true }
    );
  } else {
    await Product.findByIdAndUpdate(
      pid,
      {
        $push: { ratings: { star, comment, postedBy: _id } },
      },
      { new: true }
    );
  }

  const updatedProduct = await Product.findById(pid);
  const ratingCount = updatedProduct.ratings.length;
  const sumRatings = updatedProduct.ratings.reduce(
    (sum, el) => sum + +el.star,
    0
  );
  updatedProduct.totalRatings =
    Math.round((sumRatings * 10) / ratingCount) / 10;

  await updatedProduct.save();

  return res.status(200).json({
    status: true,
    updatedProduct,
  });
});

const uploadImagesProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  if (!req.files) {
    throw new Error("Missing inputs");
  }
  const response = await Product.findByIdAndUpdate(
    pid,
    {
      $push: { images: { $each: req.files.map((el) => el.path) } },
    },
    { new: true }
  );

  return res.status(200).json({
    success: response ? true : false,
    uploadImageStatus: response ? response : "Cannot upload images product",
  });
});

module.exports = {
  createProduct,
  getProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  ratings,
  uploadImagesProduct,
};
