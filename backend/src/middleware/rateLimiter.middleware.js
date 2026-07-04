import ApiError from "../utils/ApiError.js";

// In-memory stores for rate limits
const messageStore = new Map();
const actionStore = new Map();

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

const getDailyMessageLimit = () => {
    if (process.env.AI_DAILY_MESSAGE_LIMIT) {
        return parseInt(process.env.AI_DAILY_MESSAGE_LIMIT, 10) || 20;
    }
    return process.env.NODE_ENV === "development" ? 100 : 20;
};

const getHourlyActionLimit = () => {
    if (process.env.AI_HOURLY_ACTION_LIMIT) {
        return parseInt(process.env.AI_HOURLY_ACTION_LIMIT, 10) || 5;
    }
    return process.env.NODE_ENV === "development" ? 20 : 5;
};

export const assistantMessageRateLimiter = (req, res, next) => {
    if (!req.user || !req.user._id) {
        return next(new ApiError(401, "Not authorized, user missing"));
    }

    const userId = String(req.user._id);
    const now = Date.now();
    const limit = getDailyMessageLimit();

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
        const retryAfter = Math.ceil(((userRecord.windowStart + ONE_DAY_MS) - now) / 1000);
        console.warn(`Rate limit reached: User ${userId} requested AI assistant message (${userRecord.count}/${limit} limit)`);
        return res.status(429).json({
            success: false,
            message: "AI Assistant limit reached. Please try again later.",
            retryAfter,
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
    const limit = getHourlyActionLimit();

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
        const retryAfter = Math.ceil(((userRecord.windowStart + ONE_HOUR_MS) - now) / 1000);
        console.warn(`Rate limit reached: User ${userId} attempted confirmed AI action (${userRecord.count}/${limit} limit)`);
        return res.status(429).json({
            success: false,
            message: "AI Assistant limit reached. Please try again later.",
            retryAfter,
        });
    }

    userRecord.count += 1;
    next();
};
