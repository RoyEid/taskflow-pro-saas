class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong") {
        super(message);
        this.success = false;
        this.statusCode = statusCode;
    }
}

export default ApiError;