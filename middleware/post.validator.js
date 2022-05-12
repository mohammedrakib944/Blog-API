const { check, validationResult } = require("express-validator");

exports.postValidator = [
  check("title")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Post title can't be empty!"),
  check("content")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Post content can't be empty!"),
  check("meta")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Meta description can't be empty!"),
  check("slug").trim().not().isEmpty().withMessage("Slug can't be empty!"),
  check("tags")
    .isArray()
    .withMessage("Tags must me array of string")
    .custom((tags) => {
      tags.forEach((val) => {
        if (typeof val !== "string") {
          throw Error("Tags must me array of string");
        }
      });
      return true;
    }),
];

exports.validate = (req, res, next) => {
  const error = validationResult(req).array();

  if (error.length) {
    return res.status(401).json({ error: error[0].msg });
  }
  next();
};
