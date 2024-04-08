const ProductCategory = require("../models/productCategory");
const asyncHandler = require("express-async-handler");

const createCategory = asyncHandler(async (req, res) => {
  const response = await ProductCategory.create(req.body);

  return res.status(200).json({
    success: response ? true : false,
    createdCategoryStatus: response
      ? response
      : "Cannot create new product-category",
  });
});

const getAllCategory = asyncHandler(async (req, res) => {
  const response = await ProductCategory.find().select("title _id");

  return res.status(200).json({
    success: response ? true : false,
    getAllCategoryStatus: response
      ? response
      : "Cannot get all product-category",
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { pcid } = req.params;
  const response = await ProductCategory.findByIdAndUpdate(pcid, req.body, {
    new: true,
  });

  return res.status(200).json({
    success: response ? true : false,
    updateCategoryStatus: response
      ? response
      : "Cannot update product-category",
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { pcid } = req.params;
  const response = await ProductCategory.findByIdAndDelete(pcid);

  return res.status(200).json({
    success: response ? true : false,
    deleteCategoryStatus: response
      ? response
      : "Cannot delete product-category",
  });
});

module.exports = {
  createCategory,
  getAllCategory,
  updateCategory,
  deleteCategory,
};
