import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiArror.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinery } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const signUp = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  if ([name, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fildes are required");
  }
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(400, "User already exists");
  }
  const AavatarLocalFilePath = req.file?.path;

  const avatar = await uploadOnCloudinery(AavatarLocalFilePath);
  const user = await User.create({
    name,
    email,
    password,
    avatar: avatar?.url,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Somthing went wrong while creating user");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

const signIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "User dose not exist with this email");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid password");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );
  const loggebInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggebInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});
const logOut = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", option)
    .cookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

export { signUp, signIn, logOut };
