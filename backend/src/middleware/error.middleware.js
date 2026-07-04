/*
ApiError creates the error.
asyncHandler catches the error.
errorMiddleware sends the error response.
*/

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Something went wrong. Please try again.";

    // Log the actual error stack locally for backend diagnostics
    console.error("TaskFlow Pro error captured:", {
        message: err.message,
        stack: err.stack,
        statusCode
    });

    // Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = 400;
        message = "A record with this information already exists.";
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors).map((val) => val.message).join(", ");
    }

    // Mongoose cast error (invalid ID format)
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid identifier format provided.";
    }

    // Prevent leaking raw stack traces or internal server error details in production
    if (statusCode === 500 && process.env.NODE_ENV === "production") {
        message = "Something went wrong. Please try again.";
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
};

export default errorHandler;