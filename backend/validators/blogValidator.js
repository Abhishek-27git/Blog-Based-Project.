const { body } = require("express-validator");
const { validate } = require("./authValidator"); // re-use formatting logic

const blogCreateRules = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required.")
    .isLength({ min: 3, max: 200 }).withMessage("Title must be between 3 and 200 characters."),
  body("content")
    .trim()
    .notEmpty().withMessage("Content is required."),
  body("category")
    .trim()
    .notEmpty().withMessage("Category is required."),
  body("tags")
    .optional()
    .custom((value) => {
      // Tags can be an array or a comma-separated string
      if (typeof value === "string") return true;
      if (Array.isArray(value)) return true;
      throw new Error("Tags must be a string or an array of strings.");
    }),
  body("status")
    .optional()
    .isIn(["draft", "published"]).withMessage("Status must be either 'draft' or 'published'."),
];

const blogUpdateRules = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage("Title must be between 3 and 200 characters."),
  body("content")
    .optional()
    .trim()
    .notEmpty().withMessage("Content cannot be empty."),
  body("category")
    .optional()
    .trim()
    .notEmpty().withMessage("Category cannot be empty."),
  body("tags")
    .optional()
    .custom((value) => {
      if (typeof value === "string") return true;
      if (Array.isArray(value)) return true;
      throw new Error("Tags must be a string or an array of strings.");
    }),
  body("status")
    .optional()
    .isIn(["draft", "published"]).withMessage("Status must be either 'draft' or 'published'."),
];

module.exports = {
  validate,
  blogCreateRules,
  blogUpdateRules,
};
