import { Router } from "express";
import {
  signIn,
  signUp,
  logOut,
  refreshToken,
  updeteAccountDetails,
  updateAvatar,
  deleteAvatar,
  deleteAccount,
  changeCurrentPassword,
  getCurrentUser,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.route("/signup-user").post(upload.single("avatar"), signUp);
router.route("/signin-user").post(signIn);
router.route("/logout-user").post(verifyJWT, logOut);
router.route("/refresh-user").get(verifyJWT, refreshToken);
router.route("/change-passwored").patch(verifyJWT, changeCurrentPassword);
router.route("/update-user-details").patch(verifyJWT, updeteAccountDetails);
router
  .route("/update-user-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvatar);
router.route("/delete-user-avatar").delete(verifyJWT, deleteAvatar);
router.route("/get-user").get(verifyJWT, getCurrentUser);
router.route("/delete-user-account").delete(verifyJWT, deleteAccount);

export default router;
