import express from "express";
import { createSupportRequest, getMySupportRequests, updateSupportRequest, deleteSupportRequest } from "../controllers/support.controller.js";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { supportValidator } from "../validators/support.validator.js";

const router = express.Router();

router.use(protect); // All support routes require authentication

router.post("/", supportValidator, validate, createSupportRequest);
router.get("/my", getMySupportRequests);
router.put("/:id", supportValidator, validate, updateSupportRequest);
router.delete("/:id", deleteSupportRequest);

export default router;
