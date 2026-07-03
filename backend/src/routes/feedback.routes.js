import express from "express";
import { createFeedback, getMyFeedback, updateFeedback, deleteFeedback } from "../controllers/feedback.controller.js";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { feedbackValidator } from "../validators/feedback.validator.js";

const router = express.Router();

router.use(protect); // All feedback routes require authentication

router.post("/", feedbackValidator, validate, createFeedback);
router.get("/my", getMyFeedback);
router.put("/:id", feedbackValidator, validate, updateFeedback);
router.delete("/:id", deleteFeedback);

export default router;
