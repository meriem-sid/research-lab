const express = require("express");
const router  = express.Router();

const { protect, authorise } = require("../middleware/auth");
const { validateCreateTeam, validateMongoId } = require("../middleware/validate");
const {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  updateTeamProgress,
  addMemberToTeam,
  removeMemberFromTeam,
  deleteTeam,
  getMemberTeams,
  updateTaskStatus,
  addProjectMember,
  removeProjectMember,
  addProjectTask,
} = require("../controllers/teamController");

// ── Public
router.get("/",              getTeams);    // ?active=true&department=<id>
router.get("/member/:memberId", getMemberTeams); // teams a member belongs to
router.get("/:id",           getTeamById); // full team detail

// ── Admin only
router.post  ("/",                      protect, authorise("admin"), validateCreateTeam, createTeam);
router.put   ("/:id",                   protect, authorise("admin"), validateMongoId("id"), updateTeam);
router.delete("/:id",                   protect, authorise("admin"), validateMongoId("id"), deleteTeam);

// Progress bar update
router.patch ("/:id/progress",          protect, authorise("admin"), validateMongoId("id"), updateTeamProgress);

// Member management within a team
router.post  ("/:id/members",           protect, authorise("admin"), validateMongoId("id"), addMemberToTeam);
router.delete("/:id/members/:memberId", protect, authorise("admin"), validateMongoId("id"), removeMemberFromTeam);

// Task status update within a project (authenticated users)
router.patch(
  "/:id/projects/:projectIndex/tasks/:taskIndex",
  protect,
  validateMongoId("id"),
  updateTaskStatus
);

// Add / remove project members (team leader or admin)
router.post(
  "/:id/projects/:projectIndex/members",
  protect,
  authorise("team_leader", "admin"),
  validateMongoId("id"),
  addProjectMember
);
router.delete(
  "/:id/projects/:projectIndex/members/:memberId",
  protect,
  authorise("team_leader", "admin"),
  validateMongoId("id"),
  removeProjectMember
);

// Add task to project (team leader or admin)
router.post(
  "/:id/projects/:projectIndex/tasks",
  protect,
  authorise("team_leader", "admin"),
  validateMongoId("id"),
  addProjectTask
);

module.exports = router;