import express from "express";
import passport from "passport";

import {
    getCurrentUser,
    loginUser,
    registerUser,
    changePassword,
    updateProfile,
    resendVerificationCode,
    verifyEmail,
    forgotPassword,
    resetPassword,
    oauthSuccess,
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

// OAuth Routes
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
);
router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_failed`, session: false }),
    oauthSuccess
);

router.get(
    "/github",
    passport.authenticate("github", { scope: ["user:email"], session: false })
);
router.get(
    "/github/callback",
    passport.authenticate("github", { failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_failed`, session: false }),
    oauthSuccess
);

router.post("/resend-verification", resendVerificationCode);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getCurrentUser);
router.patch("/profile", protect, updateProfile);
router.patch("/change-password", protect, changePassword);

export default router;
