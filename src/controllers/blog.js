const Blog = require("../models/blog");
const asyncHandler = require("express-async-handler");

const createBlog = asyncHandler(async (req, res) => {
  const { title, description, category } = req.body;
  if (!title || !description || !category) {
    return res.status(400).json("Missing Input");
  }

  const response = await Blog.create(req.body);

  return res.status(200).json({
    success: response ? true : false,
    createdBlogStatus: response ? response : "Can not create new blog!",
  });
});

const updateBlog = asyncHandler(async (req, res) => {
  const { bid } = req.params;
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json("Missing Input");
  }
  const response = await Blog.findByIdAndUpdate(bid, req.body, { new: true });

  return res.status(200).json({
    success: response ? true : false,
    updateBlogStatus: response ? response : "Can not update blog!",
  });
});

const getBlogs = asyncHandler(async (req, res) => {
  const response = await Blog.find();

  return res.status(200).json({
    success: response ? true : false,
    getBlogStatus: response ? response : "Can not get blogs!",
  });
});

const deleteBlog = asyncHandler(async (req, res) => {
  const { bid } = req.params;
  const response = await Blog.findByIdAndDelete(bid);

  return res.status(200).json({
    success: response ? true : false,
    deleteBlogStatus: response ? response : "Can not delete blogs!",
  });
});

const likeBlog = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { bid } = req.params;

  if (!bid) {
    return res.status(400).json("Missing Input");
  }

  const blog = await Blog.findById(bid);

  const alreadyDislike = blog?.dislikes?.find((el) => el.toString() === _id);
  if (alreadyDislike) {
    const response = await Blog.findByIdAndUpdate(
      bid,
      {
        $pull: { dislikes: _id },
      },
      { new: true }
    );
    return res.status(200).json({
      success: response ? true : false,
      rs: response,
    });
  }

  const isLiked = blog?.likes?.find((el) => el.toString() === _id);
  if (isLiked) {
    const response = await Blog.findByIdAndUpdate(
      bid,
      {
        $pull: { likes: _id },
      },
      { new: true }
    );
    return res.status(200).json({
      success: response ? true : false,
      rs: response,
    });
  } else {
    const response = await Blog.findByIdAndUpdate(
      bid,
      { $push: { likes: _id } },
      { new: true }
    );
    return res.status(200).json({
      success: response ? true : false,
      rs: response,
    });
  }
});

const dislikeBlog = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { bid } = req.params;

  if (!bid) {
    return res.status(400).json("Missing Input");
  }

  const blog = await Blog.findById(bid);

  const alreadyLike = blog?.likes?.find((el) => el.toString() === _id);
  if (alreadyLike) {
    const response = await Blog.findByIdAndUpdate(
      bid,
      {
        $pull: { likes: _id },
      },
      { new: true }
    );
    return res.status(200).json({
      success: response ? true : false,
      rs: response,
    });
  }

  const isDislike = blog?.dislikes?.find((el) => el.toString() === _id);
  if (isDislike) {
    const response = await Blog.findByIdAndUpdate(
      bid,
      {
        $pull: { dislikes: _id },
      },
      { new: true }
    );
    return res.status(200).json({
      success: response ? true : false,
      rs: response,
    });
  } else {
    const response = await Blog.findByIdAndUpdate(
      bid,
      { $push: { dislikes: _id } },
      { new: true }
    );
    return res.status(200).json({
      success: response ? true : false,
      rs: response,
    });
  }
});

const getBlog = asyncHandler(async (req, res) => {
  const { bid } = req.params;
  const blog = await Blog.findByIdAndUpdate(
    bid,
    { $inc: { numberViews: 1 } },
    { new: true }
  )
    .populate("dislikes", "firstname lastname")
    .populate("likes", "firstname lastname");
  return res.status(200).json({
    success: blog ? true : false,
    rs: blog,
  });
});

const uploadImageBlog = asyncHandler(async (req, res) => {
  const { bid } = req.params;
  if (!req.file) {
    throw new Error("Missing inputs");
  }
  const response = await Blog.findByIdAndUpdate(
    bid,
    {
      image: req.file.path,
    },
    { new: true }
  );

  return res.status(200).json({
    success: response ? true : false,
    uploadImageBlogStatus: response ? response : "Cannot upload images blog",
  });
});

module.exports = {
  createBlog,
  updateBlog,
  getBlogs,
  deleteBlog,
  likeBlog,
  dislikeBlog,
  getBlog,
  uploadImageBlog,
};
