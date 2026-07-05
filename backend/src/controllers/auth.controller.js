import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// Helper to generate 6-digit code
const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        if (!existingUser.isEmailVerified) {
            console.warn(`[Auth] Registration attempted for existing but unverified email: ${normalizedEmail}`);
            throw new ApiError(400, "Account already exists but is not verified. Please verify your email or resend verification.");
        }
        console.warn(`[Auth] Registration attempted for already verified email: ${normalizedEmail}`);
        throw new ApiError(400, "User already exists with this email");
    }

    const verificationCode = generateCode();
    console.log(`[Auth] Generated verification code for new user: ${normalizedEmail}`);
    
    const hashedCode = await bcrypt.hash(verificationCode, 10);
    console.log(`[Auth] Verification code hashed successfully for new user: ${normalizedEmail}`);

    const user = await User.create({
        name,
        email: normalizedEmail,
        password,
        isEmailVerified: false,
        emailVerificationCode: hashedCode,
        emailVerificationExpires: Date.now() + 15 * 60 * 1000, // 15 mins
    });
    console.log(`[Auth] User document created successfully in DB for: ${user.email} (ID: ${user._id})`);

    try {
        await sendEmail({
            email: user.email,
            subject: "Verify your email address",
            message: `Your verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes.`,
            code: verificationCode,
        });
        console.log(`[Auth] Verification email sent successfully to ${user.email}`);

        res.status(201).json(
            new ApiResponse(201, "Account created. Please verify your email.", {
                email: user.email,
                emailSendFailed: false,
                message: "Account created. Please verify your email."
            })
        );
    } catch (error) {
        console.error(`[Auth] Verification email sending failed for ${user.email}: ${error.message}`);
        
        res.status(201).json(
            new ApiResponse(201, "Account created, but verification email could not be sent. Please use resend verification.", {
                email: user.email,
                emailSendFailed: true,
                message: "Account created, but verification email could not be sent. Please use resend verification."
            })
        );
    }
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (!user.password) {
        throw new ApiError(
            400,
            "This account was created with Google or GitHub. Please continue with that provider."
        );
    }

    if (!user.isEmailVerified) {
        throw new ApiError(403, "Please verify your email before logging in.");
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid email or password");
    }

    const token = generateToken(user._id);

    res.status(200).json(
        new ApiResponse(200, "User logged in successfully", {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified,
                status: user.status,
            },
            token,
        })
    );
});

export const resendVerificationCode = asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    if (!email) throw new ApiError(400, "Email is required");

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[Auth] Resend verification code requested for: ${normalizedEmail}`);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        console.warn(`[Auth] Resend verification code failed: User not found for ${normalizedEmail}`);
        throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
        console.warn(`[Auth] Resend verification code failed: User ${normalizedEmail} is already verified`);
        throw new ApiError(400, "Email is already verified");
    }

    const verificationCode = generateCode();
    console.log(`[Auth] Generated new verification code for existing user: ${normalizedEmail}`);

    const hashedCode = await bcrypt.hash(verificationCode, 10);
    console.log(`[Auth] Verification code hashed successfully for existing user: ${normalizedEmail}`);

    user.emailVerificationCode = hashedCode;
    user.emailVerificationExpires = Date.now() + 15 * 60 * 1000;
    await user.save();
    console.log(`[Auth] User document updated with new verification code in DB for: ${user.email}`);

    try {
        await sendEmail({
            email: user.email,
            subject: "Verify your email address",
            message: `Your new verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes.`,
            code: verificationCode,
        });
        console.log(`[Auth] Resend verification email sent successfully to ${user.email}`);
        console.log(`[Auth] Resend verification code process completed successfully for user ${user.email}`);

        res.status(200).json(new ApiResponse(200, "Verification code sent to your email", {}));
    } catch (error) {
        console.error(`[Auth] Resend verification email sending failed for ${user.email}: ${error.message}`);
        console.error(`[Auth] Resend verification code process failed for user ${user.email}: ${error.message}`);
        throw new ApiError(500, "Failed to send verification email. Please try again.");
    }
});

export const verifyEmail = asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        throw new ApiError(400, "Email and code are required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+emailVerificationCode +emailVerificationExpires");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
        throw new ApiError(400, "Invalid or expired verification code");
    }

    if (Date.now() > user.emailVerificationExpires) {
        throw new ApiError(400, "Verification code has expired");
    }

    const isMatch = await bcrypt.compare(code.toString(), user.emailVerificationCode);

    if (!isMatch) {
        throw new ApiError(400, "Invalid verification code");
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json(
        new ApiResponse(200, "Email verified successfully", {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified,
                status: user.status,
            },
            token,
        })
    );
});

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) throw new ApiError(400, "Email is required");

    const normalizedEmail = email.trim().toLowerCase();
    console.log("FORGOT PASSWORD EMAIL:", normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });
    console.log("USER FOUND:", !!user);

    if (!user) {
        // Return 200 to prevent email enumeration
        return res.status(200).json(new ApiResponse(200, "If an account exists, a reset code was sent", {}));
    }

    const resetCode = generateCode();
    
    const hashedCode = await bcrypt.hash(resetCode, 10);

    user.passwordResetCode = hashedCode;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    await user.save();
    console.log("RESET CODE SAVED:", !!user.resetPasswordCode);

    try {
        await sendEmail({
            email: user.email,
            subject: "Your TaskFlow Pro password reset code",
            message: `Your password reset code is: ${resetCode}\n\nThis code will expire in 15 minutes.`,
            code: resetCode,
        });
        console.log("RESET EMAIL SENT");
    } catch (error) {
        console.log("RESET EMAIL ERROR:", error.message);
        throw new ApiError(500, "Failed to send reset email. Please try again.");
    }

    res.status(200).json(new ApiResponse(200, "If an account exists, a reset code was sent", {}));
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        throw new ApiError(400, "Email, code, and new password are required");
    }

    if (newPassword.length < 8 ||
        !/[A-Z]/.test(newPassword) ||
        !/[a-z]/.test(newPassword) ||
        !/[0-9]/.test(newPassword)
    ) {
        throw new ApiError(400, "Password does not meet complexity requirements");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+passwordResetCode +passwordResetExpires");

    if (!user || !user.passwordResetCode || !user.passwordResetExpires) {
        throw new ApiError(400, "Invalid or expired reset code");
    }

    if (Date.now() > user.passwordResetExpires) {
        throw new ApiError(400, "Reset code has expired");
    }

    const isMatch = await bcrypt.compare(code.toString(), user.passwordResetCode);

    if (!isMatch) {
        throw new ApiError(400, "Invalid reset code");
    }

    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json(new ApiResponse(200, "Password reset successfully. You can now login.", {}));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json(
        new ApiResponse(200, "Current user fetched successfully", {
            user: req.user,
        })
    );
});

export const changePassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("+password");

    if (user.provider !== "local" && !user.password) {
        throw new ApiError(400, "Your account is managed through Google/GitHub sign-in. Password changes must be handled from your provider account.");
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Please provide current and new password");
    }

    if (newPassword.length < 8 ||
        !/[A-Z]/.test(newPassword) ||
        !/[a-z]/.test(newPassword) ||
        !/[0-9]/.test(newPassword)
    ) {
        throw new ApiError(400, "New password does not meet complexity requirements");
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json(
        new ApiResponse(200, "Password changed successfully", {})
    );
});

export const updateProfile = asyncHandler(async (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        throw new ApiError(400, "Name is required");
    }

    const user = await User.findById(req.user._id);
    user.name = name;
    await user.save();

    res.status(200).json(
        new ApiResponse(200, "Profile updated successfully", {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified,
                status: user.status,
            }
        })
    );
});

export const oauthSuccess = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_failed`);
    }

    const token = generateToken(req.user._id);
    const provider = req.oauthProvider || (req.user.githubId ? "github" : "google");

    // Redirect to frontend with token, email, and provider details
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/oauth-success?token=${token}&email=${encodeURIComponent(req.user.email)}&provider=${encodeURIComponent(provider)}`);
});