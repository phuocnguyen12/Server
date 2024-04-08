const Brand = require("../models/brand");
const asyncHandler = require("express-async-handler");

const createNewBrand = asyncHandler(async (req, res) => {
  const response = await Brand.create(req.body);

  return res.status(200).json({
    success: response ? true : false,
    createdBrandStatus: response ? response : "Cannot create new brand",
  });
});

const getAllBrand = asyncHandler(async (req, res) => {
  const response = await Brand.find();

  return res.status(200).json({
    success: response ? true : false,
    getAllBrandStatus: response ? response : "Cannot get all brand",
  });
});

const updateBrand = asyncHandler(async (req, res) => {
  const { brid } = req.params;
  const response = await Brand.findByIdAndUpdate(brid, req.body, {
    new: true,
  });

  return res.status(200).json({
    success: response ? true : false,
    updateBrandStatus: response ? response : "Cannot update brand",
  });
});

const deleteBrand = asyncHandler(async (req, res) => {
  const { brid } = req.params;
  const response = await Brand.findByIdAndDelete(brid);

  return res.status(200).json({
    success: response ? true : false,
    deleteBrandStatus: response ? response : "Cannot delete brand",
  });
});

module.exports = {
  createNewBrand,
  getAllBrand,
  updateBrand,
  deleteBrand,
};
