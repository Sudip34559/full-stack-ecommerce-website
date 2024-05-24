import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

export const veriryRole = asyncHandler(async (req, _, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(401, "user not found");
  }
  if (user.role !== "admin") {
    throw new ApiError(401, "user is not admin");
  }
  next();
});
