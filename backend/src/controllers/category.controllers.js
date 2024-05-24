import { isValidObjectId } from "mongoose";
import { Category } from "../models/category.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiArror.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Product } from "../models/product.models.js";

const createCategory = asyncHandler(async (req, res, next) => {
  const { name, parentCategory } = req.body;
  if (!name) {
    throw new ApiError(400, "name is required");
  }
  const pvCategory = await Category.findOne({ name: name });
  if (pvCategory) {
    throw new ApiError(400, "category already exist");
  }
  let addParentCategory;
  if (parentCategory) {
    addParentCategory = await Category.findOne({ name: parentCategory });
  }

  const category = await Category.create({
    name,
    parentCategory: addParentCategory?._id || null,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, category, "category created"));
});
const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find();
  return res
    .status(200)
    .json(new ApiResponse(200, categories, "categories fetched"));
});
const getCategoryByname = asyncHandler(async (req, res, next) => {
  const { name } = req.params;
  const category = await Category.findOne({ name });
  if (!category) {
    throw new ApiError(400, "category does not exist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, category, "category fetched"));
});
const getCategoryById = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  if (!isValidObjectId(categoryId)) {
    throw new ApiError(400, "invalid category id");
  }
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError(400, "category does not exist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, category, "category fetched"));
});
const findProductByCategory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  if (!isValidObjectId(categoryId)) {
    throw new ApiError(400, "invalid category id");
  }
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError(400, "category does not exist");
  }
  const products = await Product.find({ category: categoryId });
  return res
    .status(200)
    .json(new ApiResponse(200, products, "products fetched"));
});

export {
  createCategory,
  getCategories,
  getCategoryByname,
  findProductByCategory,
  getCategoryById,
};
