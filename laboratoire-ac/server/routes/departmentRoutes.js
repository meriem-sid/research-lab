const express = require("express");
const router  = express.Router();

const { protect, authorise } = require("../middleware/auth");
const { validateCreateDepartment, validateMongoId } = require("../middleware/validate");
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

// ── Public
router.get("/",    getDepartments);    
router.get("/:id", getDepartmentById); 

// ── Admin only 
router.post  ("/",    protect, authorise("admin"), validateCreateDepartment, createDepartment);
router.put   ("/:id", protect, authorise("admin"), validateMongoId("id"), updateDepartment);
router.delete("/:id", protect, authorise("admin"), validateMongoId("id"), deleteDepartment);

module.exports = router;