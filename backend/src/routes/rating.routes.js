import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  deleteRating,
  getProductAllRatings,
  giveRatingInAProduct,
} from "../controllers/rating.controllers.js";

const router = Router();

router.route("/give-rating/:productId").post(verifyJWT, giveRatingInAProduct);
router.route("/get-ratings/:productId").get(getProductAllRatings);
router.route("/delete-rating/:ratingId").delete(verifyJWT, deleteRating);

export default router;
