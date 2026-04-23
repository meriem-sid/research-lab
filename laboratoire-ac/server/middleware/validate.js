const { body, param, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map((e) => e.msg).join(", ") });
  }
  next();
};

const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  handleValidationErrors,
];

const validateLogin = [
  body("email").trim().notEmpty().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

const validateCreateUser = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").isIn(["admin", "head_of_lab", "member", "team_leader"]).withMessage("Invalid role"),
  handleValidationErrors,
];

const validateCreateMember = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("academicRole")
    .isIn(["Professor", "Doctor", "PhD Student", "Researcher", "Associate"])
    .withMessage("Invalid academic role"),
  handleValidationErrors,
];

const validateCreateTeam = [
  body("teamName").trim().notEmpty().withMessage("Team name is required"),
  body("leaderName").trim().notEmpty().withMessage("Leader name is required"),
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("researchFocus").trim().notEmpty().withMessage("Research focus is required"),
  handleValidationErrors,
];

const validateCreatePublication = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("authors").isArray({ min: 1 }).withMessage("At least one author is required"),
  body("year").isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage("Invalid year"),
  body("publisher").trim().notEmpty().withMessage("Publisher is required"),
  body("type")
    .optional()
    .isIn(["Journal Article", "Conference Paper", "Book Chapter", "Thesis", "Technical Report", "Preprint"])
    .withMessage("Invalid publication type"),
  handleValidationErrors,
];

const validateCreateNews = [
  body("headline").trim().notEmpty().withMessage("Headline is required"),
  body("fullStory").trim().notEmpty().withMessage("Full story is required"),
  body("category")
    .optional()
    .isIn(["Event", "Award", "Publication", "Seminar", "Announcement", "General"])
    .withMessage("Invalid category"),
  handleValidationErrors,
];

const validateCreateDepartment = [
  body("name").trim().notEmpty().withMessage("Department name is required"),
  handleValidationErrors,
];

const validateMongoId = (field = "id") => [
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateUser,
  validateCreateMember,
  validateCreateTeam,
  validateCreatePublication,
  validateCreateNews,
  validateCreateDepartment,
  validateMongoId,
  handleValidationErrors,
};
