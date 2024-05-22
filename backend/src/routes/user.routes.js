import { Router } from "express";
import { signIn, signUp, logOut } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.route("/signup-user").post(upload.single("avatar"), signUp);
router.route("/signin-user").post(signIn);
router.route("/logout-user").post(verifyJWT, logOut);

export default router;
