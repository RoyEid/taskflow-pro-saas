import express from "express";
import { globalSearch } from "../controllers/search.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// Search strictly requires authentication
router.use(protect);

router.get("/", globalSearch);

export default router;
