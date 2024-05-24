import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiArror.js";
import { Address } from "../models/address.models.js";
import { User } from "../models/user.models.js";

const createAddress = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber, street, city, state, pinCode } = req.body;
  if (!fullName || !phoneNumber || !street || !city || !state || !pinCode) {
    throw new ApiError(400, "all fildes are required");
  }
  const existingAddress = await User.findOne({
    fullName: fullName,
    phoneNumber: phoneNumber,
  });
  if (existingAddress) {
    throw new ApiError(400, "Address already exists");
  }

  const address = await Address.create({
    fullName,
    phoneNumber,
    street,
    city,
    state,
    pinCode,
    user: req.user?._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, address, "Address created successfully"));
});

const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user?._id });
  return res
    .status(200)
    .json(new ApiResponse(200, addresses, "Addresses fetched successfully"));
});

const updateAdress = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber, street, city, state, pinCode } = req.body;
  if (!fullName || !phoneNumber || !street || !city || !state || !pinCode) {
    throw new ApiError(400, "all fildes are required");
  }
  const address = await Address.findByIdAndUpdate(
    req.params.id,
    {
      $set: { fullName, phoneNumber, street, city, state, pinCode },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, address, "Address updated successfully"));
});

const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  if (!isValidObjectId(addressId)) {
    throw new ApiError(400, "Invalid address id");
  }
  const address = await Address.findByIdAndDelete(addressId);
  if (!address) {
    throw new ApiError(400, "Invalid address id");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, address, "Address deleted successfully"));
});
export { createAddress, getAddresses, updateAdress, deleteAddress };
