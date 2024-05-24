import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiArror.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinery, removeOnCloudinery } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";
import { Category } from "../models/category.models.js";
import { Product } from "../models/product.models.js";
import { Rating } from "../models/rating.models.js";

const createProduct = asyncHandler(async (req, res, next) => {
  const { name, description, price, stockQuantity, category, offer } = req.body;
  if (
    [name, description, price, stockQuantity, category, offer].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(
      400,
      "name, description, price and stockQuantity are required"
    );
  }
  const addCategory = await Category.find({ name: category });
  const productLocalfilePath = req.file?.path;
  if (!productLocalfilePath) {
    throw new ApiError(400, "image is required");
  }
  const imageUrl = await uploadOnCloudinery(productLocalfilePath);
  const product = await Product.create({
    name,
    description,
    price,
    image: imageUrl?.url,
    stockQuantity,
    owner: req.user._id,
    category: addCategory[0]._id,
    offer,
  });
  res.status(201).json(new ApiResponse(201, "product created", product));
});
const getProduct = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "product not found");
  }
  res.status(200).json(new ApiResponse(200, product, "product found"));
});
const updateProduct = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  if (!productId) {
    throw new ApiError(404, "product Id is required");
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "product not found");
  }
  const pvName = product.name;
  const pvQuantity = product.stockQuantity;
  const pvDescription = product.description;
  const pvPrice = product.price;
  const pvOffer = product.offer;
  const {
    name = pvName,
    description = pvDescription,
    price = pvPrice,
    stockQuantity = pvQuantity,
    offer = pvOffer,
  } = req.body;

  const productLocalfilePath = req.file?.path;
  if (productLocalfilePath) {
    const pvImagePath = product.image;
    await removeOnCloudinery(pvImagePath);
    const imageUrl = await uploadOnCloudinery(productLocalfilePath);
    product.image = imageUrl?.url;
    product.save({ validateBeforeSave: false });
  }
  const changedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      $set: {
        name,
        description,
        price,
        stockQuantity,
        offer,
      },
    },
    { new: true }
  );
  res.status(200).json(new ApiResponse(200, changedProduct, "product updated"));
});
const getProductRating = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product id");
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(400, "Invalid product id");
  }
  const ratings = await Rating.find({ product: productId });
  const rating = ratings.map((rating) => rating.rating);
  const total = rating
    .map((num) => parseInt(num))
    .reduce((acc, curr) => acc + curr, 0);

  let length = rating.length;
  let avaragereting;
  if (length === 0) {
    avaragereting = 0;
  } else {
    let avarage = total / length;
    avaragereting = avarage.toFixed(1);
  }
  const retedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      $set: {
        ratings: avaragereting,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, retedProduct, "product reted successfully"));
});
const getAdminsAllProducts = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, query, sortBy, sortType, adminId } = req.query;
  if (!isValidObjectId(adminId)) {
    throw new ApiError(404, "admin Id is required");
  }
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;
  let filter = { owner: adminId };
  if (query) {
    filter.name = { $regex: query, $options: "i" };
  }
  const products = await Product.find(filter).limit(limitNumber).skip(skip);
  const count = await Product.countDocuments(filter);
  if (sortBy && sortType) {
    // Sort the videos array based on sortBy and sortType
    products.sort((a, b) => {
      if (sortType === "asc") {
        return a[sortBy] < b[sortBy] ? -1 : 1;
      } else {
        return a[sortBy] > b[sortBy] ? -1 : 1;
      }
    });
  }
  res.status(200).json(
    new ApiResponse(
      200,
      {
        products: products,
        totalProduct: count,
        totalPages: Math.ceil(count / limitNumber),
        currentPage: pageNumber,
      },
      "products found"
    )
  );
});
const deleteProduct = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  if (!productId) {
    throw new ApiError(404, "product Id is required");
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "product not found");
  }
  const pvImagePath = product.image;
  await removeOnCloudinery(pvImagePath);
  await Product.findByIdAndDelete(productId);
  res.status(200).json(new ApiResponse(200, {}, "product deleted"));
});

export {
  createProduct,
  updateProduct,
  getProduct,
  getAdminsAllProducts,
  deleteProduct,
  getProductRating,
};
