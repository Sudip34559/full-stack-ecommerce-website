import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  addToCart,
  deleteUserCart,
  getUserCart,
  updateUserCart,
} from "../controllers/cart.controllers.js";

const router = Router();
router.use(verifyJWT);
router.route("/add-to-cart").post(addToCart);
router.route("/get-cart").get(getUserCart);
router.route("/update-cart").post(updateUserCart);
router.route("/delete-cart").delete(deleteUserCart);

export default router;
