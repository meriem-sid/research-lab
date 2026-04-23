const express = require("express");
const router  = express.Router();

const { protect, authorise } = require("../middleware/auth");
const { validateCreatePublication, validateMongoId } = require("../middleware/validate");
const {
  getPublications,
  searchPublications,
  getPublicationById,
  getPublicationStats,
  exportCitation,
  createPublication,
  getPendingPublications,
  approvePublication,
  rejectPublication,
  getAllPublicationsAdmin,
  updatePublication,
  deletePublication,
  getTeamPublications,
} = require("../controllers/publicationController");

// ── Public ────────────────────────────────────────────────────────────────────
// IMPORTANT: all named single-segment routes must come BEFORE /:id

router.get("/search",    searchPublications);   // /search?query=AI
router.get("/stats",     getPublicationStats);  // aggregated stats

// ── Admin — approval workflow (MUST be before /:id) ──────────────────────────────
// These are single-segment routes; if placed after /:id Express will match
// /:id first and treat "pending" / "all" as an ObjectId, causing a CastError.
router.get("/pending",     protect, authorise("admin"), getPendingPublications);
router.get("/all",         protect, authorise("admin"), getAllPublicationsAdmin);
router.get("/team/:teamId", protect, authorise("admin", "member", "team_leader"), validateMongoId("teamId"), getTeamPublications);

router.get("/",          getPublications);      // approved list
router.get("/:id",       getPublicationById);   // single approved pub
router.get("/:id/cite",  exportCitation);       // BibTeX / APA export

router.put("/:id/approve", protect, authorise("admin"), validateMongoId("id"), approvePublication);
router.put("/:id/reject",  protect, authorise("admin"), validateMongoId("id"), rejectPublication);

// ── Admin — CRUD ──────────────────────────────────────────────────────────────
router.put   ("/:id", protect, authorise("admin"), validateMongoId("id"), updatePublication);
router.delete("/:id", protect, authorise("admin"), validateMongoId("id"), deletePublication);

// ── Admin | Member | Team Leader — submit a publication ───────────────────────
// team_leader added so the frontend My Work / Publications page can submit
router.post("/", protect, authorise("admin", "member", "team_leader"), validateCreatePublication, createPublication);

module.exports = router;