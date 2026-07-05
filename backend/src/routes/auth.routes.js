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
    (req, res, next) => {
        passport.authenticate("google", { session: false }, (err, user, info) => {
            if (err) {
                console.error("[OAuth] Google strategy auth failed:", err.message);
                return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=${encodeURIComponent(err.message)}`);
            }
            if (!user) {
                return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_failed`);
            }
            req.user = user;
            req.oauthProvider = "google";
            next();
        })(req, res, next);
    },
    oauthSuccess
);

router.get(
    "/github",
    passport.authenticate("github", { scope: ["user:email"], session: false })
);
router.get(
    "/github/callback",
    (req, res, next) => {
        passport.authenticate("github", { session: false }, (err, user, info) => {
            if (err) {
                console.error("[OAuth] GitHub strategy auth failed:", err.message);
                return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=${encodeURIComponent(err.message)}`);
            }
            if (!user) {
                return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_failed`);
            }
            req.user = user;
            req.oauthProvider = "github";
            next();
        })(req, res, next);
    },
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
