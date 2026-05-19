const ApiError = require("../utils/ApiError");

/**
 * Role-based access control middleware.
 * Must be used AFTER the auth middleware (req.user must exist).
 *
 * Usage:
 *   router.get("/admin/dashboard", auth, roleGuard("admin"), controller)
 *   router.get("/mod/area",        auth, roleGuard("admin", "moderator"), controller)
 */
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Not authenticated."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You do not have permission to access this resource.")
      );
    }

    next();
  };
};

module.exports = roleGuard;
