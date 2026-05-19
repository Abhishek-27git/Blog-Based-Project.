const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");

/**
 * Middleware to check if the logged-in user is the owner of a resource.
 * Admin can also bypass this check if specified (e.g. for deletes/moderation).
 * 
 * @param {string} modelName - The Mongoose model name (e.g. 'Blog', 'Comment')
 * @param {boolean} allowAdmin - Whether admins are allowed to bypass ownership checks
 */
const ownership = (modelName, allowAdmin = true) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.commentId;
      if (!resourceId) {
        return next(new ApiError(400, "Resource ID is missing from parameters."));
      }

      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return next(new ApiError(400, `Invalid ${modelName} ID.`));
      }

      const Model = mongoose.model(modelName);
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return next(new ApiError(404, `${modelName} not found.`));
      }

      // Check if user is admin and admin bypass is allowed
      if (allowAdmin && req.user.role === "admin") {
        req.resource = resource; // attach resource to request for controllers to use
        return next();
      }

      // Check author/user field (some collections call it 'author', some 'user')
      const ownerId = resource.author || resource.user;
      if (!ownerId) {
        return next(new ApiError(500, `Unable to determine owner of this ${modelName}.`));
      }

      if (ownerId.toString() !== req.user._id.toString()) {
        return next(new ApiError(403, `You do not have permission to modify this ${modelName}.`));
      }

      req.resource = resource; // attach resource to request for controllers to use
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = ownership;
