import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { veriryRole } from "../middlewares/roleCheck.middlewares.js";
import {
  createProduct,
  deleteProduct,
  getAdminsAllProducts,
  getProduct,
  getProductRating,
  updateProduct,
} from "../controllers/product.controllers.js";

const router = Router();
router.use(verifyJWT);
router
  .route("/create-product")
  .post(veriryRole, upload.single("image"), createProduct);
router.route("/gp/:productId").get(getProduct);
router
  .route("/u/:productId")
  .patch(veriryRole, upload.single("image"), updateProduct);
router.route("/gpr/:productId").get(getProductRating);
router.route("/admin").get(veriryRole, getAdminsAllProducts);
router.route("/d/:productId").delete(veriryRole, deleteProduct);
export default router;
