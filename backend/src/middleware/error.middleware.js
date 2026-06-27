/*
ApiError creates the error.
asyncHandler catches the error.
errorMiddleware sends the error response.
*/

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message || "Server Error",
    });
};

export default errorHandler;