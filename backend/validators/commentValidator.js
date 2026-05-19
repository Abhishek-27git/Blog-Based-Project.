const { body } = require("express-validator");
const { validate } = require("./authValidator");

const commentRules = [
  body("content")
    .trim()
    .notEmpty().withMessage("Comment content cannot be empty.")
    .isLength({ max: 1000 }).withMessage("Comment cannot exceed 1000 characters."),
  body("parentComment")
    .optional()
    .isMongoId().withMessage("Invalid parent comment ID."),
];

module.exports = {
  validate,
  commentRules,
};
