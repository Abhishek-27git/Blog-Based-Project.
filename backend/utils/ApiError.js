/**
 * Custom API Error class.
 * Thrown from controllers; caught by the global errorHandler middleware.
 *
 * Usage:
 *   throw new ApiError(404, "Blog not found");
 *   throw new ApiError(403, "Not authorized to edit this blog");
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;     // optional array of field-level validation errors
    this.isOperational = true; // distinguishes expected errors from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
