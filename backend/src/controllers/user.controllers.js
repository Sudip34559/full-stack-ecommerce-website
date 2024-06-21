import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinery, removeOnCloudinery } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/apiResponse.js";
import crypto from "crypto";
import { sendEmail } from "../services/email.service.js";
import { ApiError } from "../utils/apiArror.js";
import { sendOTP } from "../services/sms.service.js";

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
const verifyOIP = async (req, res, next) => {
  const { otp } = req.body;
  const storedOTP = req.session.otp;
  if (storedOTP && storedOTP.otp === otp && Date.now() < storedOTP.expires) {
    // OTP matched and not expired
    req.session.otp = null; // Clear the OTP from session after successful verification
    return true;
  } else {
    // OTP not matched or expired
    req.session.otp = null;
    return res.status(400).json(new ApiResponse(400, "Invalid OTP"));
  }
};
const signUp = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  console.log(req.body);
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
const refreshToken = asyncHandler(async (req, res, next) => {
  const incommingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incommingRefreshToken) {
    throw new ApiError(400, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken.id);
    if (!user) {
      throw new ApiError(400, "Invalid refresh token");
    }
    if (incommingRefreshToken !== user.refreshToken) {
      throw new ApiError(400, "refresh token is expired or used");
    }
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: user,
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPasswored, newPasswored } = req.body;
  console.log(oldPasswored, newPasswored);
  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPasswored);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid password");
  }
  user.password = newPasswored;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "password updated"));
});
const updeteAccountDetails = asyncHandler(async (req, res) => {
  const pvName = req.user?.name;
  const pvEmail = req.user?.email;
  const { name = pvName, email = pvEmail } = req.body;
  if (!email || !name) {
    throw new ApiError(400, "all fildes are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { name, email },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, "Account updated"));
});
const updateAvatar = asyncHandler(async (req, res) => {
  const AavatarLocalFilePath = req.file?.path;
  if (!AavatarLocalFilePath) {
    throw new ApiError(400, "all fildes are required");
  }
  const previousAvatar = await req.user?.avatar;
  if (previousAvatar) {
    await removeOnCloudinery(previousAvatar);
  }
  const avatar = await uploadOnCloudinery(AavatarLocalFilePath);
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: avatar?.url },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user.avatar, "avatar updated"));
});
const deleteAvatar = asyncHandler(async (req, res) => {
  const previousAvatar = await req.user?.avatar;
  if (previousAvatar) {
    await removeOnCloudinery(previousAvatar);
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar:
          "https://res.cloudinary.com/dl5szudly/image/upload/v1716384415/m2fcgjrzmzlmaa50kwkx.png",
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user.avatar, "Avatar deleted"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});
const deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user?._id);
  return res.status(200).json(new ApiResponse(200, {}, "Account deleted"));
});
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "User dose not exist with this email");
  }
  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetTokenExpiration = Date.now() + 10 * 60 * 1000;
  user.resetPasswordToken = resetToken;
  user.resetPasswordTokenExpiration = resetTokenExpiration;
  await user.save({ validateBeforeSave: false });
  const resetUrl = `http://localhost:3450/api/v1/users/reset-password/${resetToken}`;
  const message = `
   <h1>Password reset</h1>
   <h3>You requested a password reset</h3>
   <h3>Click this link to <a href="${resetUrl}">set a new password</a></h3>
   `;
  const sender = `abcd store`;
  const recipient = email;
  const subject = "Password reset";
  const body = message;
  await sendEmail(sender, recipient, subject, body);

  return res.status(200).json(new ApiResponse(200, {}, "Email sent"));
});
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;
  if (!resetToken) {
    throw new ApiError(400, "Reset token is required");
  }
  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordTokenExpiration: { $gt: Date.now() },
  });
  if (!user) {
    throw new ApiError(400, "Invalid reset token");
  }
  await User.findByIdAndUpdate(user._id, {
    $unset: {
      resetPasswordToken: 1,
      resetPasswordTokenExpiration: 1,
    },
  });
  user.password = password;
  await user.save();
  return res.status(200).json(new ApiResponse(200, {}, "Password reset"));
});

export {
  signUp,
  signIn,
  logOut,
  refreshToken,
  changeCurrentPassword,
  getCurrentUser,
  updeteAccountDetails,
  updateAvatar,
  deleteAvatar,
  deleteAccount,
  forgotPassword,
  resetPassword,
};
