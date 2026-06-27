import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors = errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
    }));

    return next(new ApiError(400, extractedErrors[0].message));
};

export default validate;