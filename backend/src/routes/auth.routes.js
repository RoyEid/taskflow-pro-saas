import express from "express";

import {
    getCurrentUser,
    loginUser,
    registerUser,
} from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
    loginValidator,
    registerValidator,
} from "../validators/auth.validator.js";

const router = express.Router();

router.post("/register", registerValidator, validate, registerUser);
router.post("/login", loginValidator, validate, loginUser);
router.get("/me", protect, getCurrentUser);

export default router;
