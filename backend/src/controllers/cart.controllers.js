import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiArror.js";
import { ApiResponse } from "../utils/apiResponse.js";

import { Product } from "../models/product.models.js";
import { ObjectId } from "mongodb";
import { Cart } from "../models/cart.models.js";

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product id");
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not ");
  }
  const cart = await Cart.findOne({ owner: req.user._id });
  if (!cart) {
    const newCart = await Cart.create({
      owner: req.user._id,
      items: [
        {
          product: productId,
          quantity,
          price: product.price * quantity,
        },
      ],
      totalAmount: product.price * quantity,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newCart, "Cart created successfully"));
  }
  const id = new ObjectId(productId);
  const existingCart = cart.items.find((item) => item.product.equals(id));
  if (existingCart) {
    throw new ApiError(400, "Cart already exists");
  }
  await Cart.findOneAndUpdate(
    { owner: req.user._id },
    {
      $addToSet: {
        items: {
          product: productId,
          quantity,
          price: product.price * quantity,
        },
      },
    }
  );
  const allCartitems = await Cart.findOne({ owner: req.user._id });
  const allPrise = allCartitems.items
    .map((item) => item.price)
    .map((num) => num)
    .reduce((acc, curr) => acc + curr, 0);
  await Cart.findOneAndUpdate(
    { owner: req.user._id },
    {
      $set: {
        totalAmount: allPrise,
      },
    }
  );
  const cart2 = await Cart.findOne({ owner: req.user._id });
  return res
    .status(200)
    .json(new ApiResponse(200, cart2, "Cart updated successfully"));
});
const getUserCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ owner: req.user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart found successfully"));
});
const updateUserCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product id");
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  const cart = await Cart.findOne({ owner: req.user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }
  const id = new ObjectId(productId);
  const existingCart = cart.items.find((item) => item.product.equals(id));
  if (!existingCart) {
    throw new ApiError(404, "Cart not found");
  }
  const updateCart = await Cart.findOne({ owner: req.user._id });
  const index = updateCart.items.findIndex((item) => item.product.equals(id));
  updateCart.items[index].quantity = quantity;
  updateCart.items[index].price = product.price * quantity;
  updateCart.save();
  const allPrise = updateCart.items
    .map((item) => item.price)
    .map((num) => num)
    .reduce((acc, curr) => acc + curr, 0);
  await Cart.findOneAndUpdate(
    { owner: req.user._id },
    {
      $set: {
        totalAmount: allPrise,
      },
    }
  );
  const cart2 = await Cart.findOne({ owner: req.user._id });
  return res
    .status(200)
    .json(new ApiResponse(200, cart2, "Cart updated successfully"));
});
const deleteUserCart = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product id");
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  const cart = await Cart.findOne({ owner: req.user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }
  const id = new ObjectId(productId);
  const existingCart = cart.items.find((item) => item.product.equals(id));
  if (!existingCart) {
    throw new ApiError(404, "Cart not found");
  }

  const deletCart = await Cart.findOne({ owner: req.user._id });
  const index = deletCart.items.findIndex((item) => item.product.equals(id));
  deletCart.items.splice(index, 1);
  deletCart.save();
  const allPrise = deletCart.items
    .map((item) => item.price)
    .map((num) => num)
    .reduce((acc, curr) => acc + curr, 0);
  await Cart.findOneAndUpdate(
    { owner: req.user._id },
    {
      $set: {
        totalAmount: allPrise,
      },
    }
  );
  const cart2 = await Cart.findOne({ owner: req.user._id });
  return res
    .status(200)
    .json(new ApiResponse(200, cart2, "Cart deleted successfully"));
});
export { addToCart, getUserCart, updateUserCart, deleteUserCart };
