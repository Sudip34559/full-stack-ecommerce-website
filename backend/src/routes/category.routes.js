import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { veriryRole } from "../middlewares/roleCheck.middlewares.js";
import {
  createCategory,
  findProductByCategory,
  getCategories,
  getCategoryById,
  getCategoryByname,
} from "../controllers/category.controllers.js";

const router = Router();

router.route("/create-category").post(verifyJWT, veriryRole, createCategory);
router.route("/").get(verifyJWT, getCategories);
router.route("/:name").get(verifyJWT, getCategoryByname);
router.route("/id/:categoryId").get(verifyJWT, getCategoryById);
router.route("/products/:categoryId").get(verifyJWT, findProductByCategory);

export default router;
