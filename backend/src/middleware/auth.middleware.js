import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (!token || token === "null" || token === "undefined") {
        throw new ApiError(401, "Not authorized, token missing");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new ApiError(401, "Not authorized, token failed");
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
        throw new ApiError(401, "User no longer exists");
    }

    if (user.status === "disabled") {
        throw new ApiError(403, "Your account is disabled");
    }

    req.user = user;

    next();
});

export default protect;