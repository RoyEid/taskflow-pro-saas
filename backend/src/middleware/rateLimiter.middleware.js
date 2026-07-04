import ApiError from "../utils/ApiError.js";

// In-memory stores for rate limits
const messageStore = new Map();
const actionStore = new Map();

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

export const assistantMessageRateLimiter = (req, res, next) => {
    if (!req.user || !req.user._id) {
        return next(new ApiError(401, "Not authorized, user missing"));
    }

    const userId = String(req.user._id);
    const now = Date.now();
    const limit = 20;

    let userRecord = messageStore.get(userId);

    if (!userRecord) {
        userRecord = { count: 0, windowStart: now };
        messageStore.set(userId, userRecord);
    }

    // Reset window if 24 hours have passed
    if (now - userRecord.windowStart > ONE_DAY_MS) {
        userRecord.count = 0;
        userRecord.windowStart = now;
    }

    if (userRecord.count >= limit) {
        // Log locally, but send a clean response to the user
        console.warn(`Rate limit reached: User ${userId} requested AI assistant message (20/day limit)`);
        return res.status(429).json({
            success: false,
            message: "AI Assistant limit reached. Please try again later.",
        });
    }

    userRecord.count += 1;
    next();
};

export const confirmedActionRateLimiter = (req, res, next) => {
    if (!req.user || !req.user._id) {
        return next(new ApiError(401, "Not authorized, user missing"));
    }

    const userId = String(req.user._id);
    const now = Date.now();
    const limit = 5;

    let userRecord = actionStore.get(userId);

    if (!userRecord) {
        userRecord = { count: 0, windowStart: now };
        actionStore.set(userId, userRecord);
    }

    // Reset window if 1 hour has passed
    if (now - userRecord.windowStart > ONE_HOUR_MS) {
        userRecord.count = 0;
        userRecord.windowStart = now;
    }

    if (userRecord.count >= limit) {
        // Log locally, but send a clean response to the user
        console.warn(`Rate limit reached: User ${userId} attempted confirmed AI action (5/hour limit)`);
        return res.status(429).json({
            success: false,
            message: "AI Assistant limit reached. Please try again later.",
        });
    }

    userRecord.count += 1;
    next();
};
