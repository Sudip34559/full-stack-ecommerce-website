import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiArror.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Product } from "../models/product.models.js";
import { Rating } from "../models/rating.models.js";

const giveRatingInAProduct = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product id");
  }
  const { rating, comment } = req.body;
  if (!rating || !comment) {
    throw new ApiError(400, "all fields are required");
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(400, "Invalid product id");
  }
  const ratings = await Rating.create({
    owner: req.user?._id,
    product: productId,
    rating,
    comment,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, ratings, "product reted successfully"));
});
const getProductAllRatings = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product id");
  }
  const ratings = await Rating.find({ product: productId });
  const count = await Rating.countDocuments({ product: productId });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ratings, totalRating: count },
        "product reted successfully"
      )
    );
});
const deleteRating = asyncHandler(async (req, res, next) => {
  const { ratingId } = req.params;
  if (!isValidObjectId(ratingId)) {
    throw new ApiError(400, "Invalid rating id");
  }
  const rating = await Rating.findById(ratingId);
  if (!rating) {
    throw new ApiError(400, "Invalid rating id");
  }
  await Rating.findByIdAndDelete(ratingId);
  return res.status(200).json(new ApiResponse(200, {}, "rating deleted"));
});
export { giveRatingInAProduct, getProductAllRatings, deleteRating };
