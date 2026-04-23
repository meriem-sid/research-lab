const express         = require("express");
const cors            = require("cors");
const morgan          = require("morgan");
const dotenv          = require("dotenv");
const rateLimit       = require("express-rate-limit");
const cookieParser    = require("cookie-parser");
const helmet          = require("helmet");
const connectDB       = require("./config/db");
const errorHandler    = require("./middleware/errorHandler");


dotenv.config();
connectDB();


const authRoutes        = require("./routes/authRoutes");
const memberRoutes      = require("./routes/memberRoutes");
const departmentRoutes  = require("./routes/departmentRoutes");
const teamRoutes        = require("./routes/teamRoutes");
const publicationRoutes = require("./routes/publicationRoutes");
const newsRoutes        = require("./routes/newsRoutes");
const dashboardRoutes   = require("./routes/dashboardRoutes");

const app = express();

// Security headers
app.use(helmet());

//  Global middleware
app.use(cors({
  origin:         process.env.CLIENT_URL || "http://localhost:3000",
  methods:        ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials:    true,  // Required for cookies to be sent cross-origin
}));

app.use(cookieParser());

// Sanitize MongoDB operators from user input
app.use(require("./middleware/mongoSanitize")());

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Strict limit for auth (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,  // 20 attempts per 15 min
  message: { success: false, message: "Too many login attempts. Please try again later." },
  skipSuccessfulRequests: true,  // Don't count successful login attempts
});

// Relaxed limit for regular API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 2000,  // ~2 requests per second
  message: { success: false, message: "Too many requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip health checks
    return req.path.includes('/health');
  },
});

// Apply limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', apiLimiter);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success:   true,
    message:   "Research Lab API is running ",
    version:   "3.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Public stats (no auth required)
const Member      = require("./models/Member");
const Team        = require("./models/Team");
const Department  = require("./models/Department");
const Publication = require("./models/Publication");

app.get("/api/stats", async (req, res, next) => {
  try {
    const [totalMembers, totalTeams, totalDepartments, totalPublications] = await Promise.all([
      Member.countDocuments(),
      Team.countDocuments({ isActive: true }),
      Department.countDocuments({ isActive: true }),
      Publication.countDocuments({ approvalStatus: "approved" }),
    ]);
    res.status(200).json({
      success: true,
      data: { totalMembers, totalTeams, totalDepartments, totalPublications },
    });
  } catch (err) {
    next(err);
  }
});


app.use("/api/auth",          authRoutes);
app.use("/api/members",       memberRoutes);
app.use("/api/departments",   departmentRoutes);
app.use("/api/teams",         teamRoutes);
app.use("/api/publications",  publicationRoutes);
app.use("/api/news",          newsRoutes);
app.use("/api/dashboard",     dashboardRoutes);


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});


app.use(errorHandler);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n Server  : http://localhost:${PORT}`);
  console.log(`Env     : ${process.env.NODE_ENV}`);
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 API ROUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 HEALTH
   GET    /api/health

 AUTH
   POST   /api/auth/register                (public — member self-reg)
   POST   /api/auth/login                   (public)
   GET    /api/auth/me                      (any logged-in user)
   PUT    /api/auth/me                      (any logged-in user)
   GET    /api/auth/pending                 (admin)
   PUT    /api/auth/approve/:id             (admin)
   PUT    /api/auth/reject/:id              (admin)
   GET    /api/auth/users                   (admin)
   POST   /api/auth/users                   (admin)
   GET    /api/auth/users/:id              (admin)
   PUT    /api/auth/users/:id              (admin)
   DELETE /api/auth/users/:id              (admin)

 MEMBERS
   GET    /api/members                      (public)
   GET    /api/members?grouped=true         (public)
   GET    /api/members/phd-tracker          (public)
   GET    /api/members/:id                  (public)
   POST   /api/members                      (admin)
   PUT    /api/members/:id                  (admin | own member)
   DELETE /api/members/:id                  (admin)

 DEPARTMENTS
   GET    /api/departments                  (public)
   GET    /api/departments/:id              (public — includes teams)
   POST   /api/departments                  (admin)
   PUT    /api/departments/:id              (admin)
   DELETE /api/departments/:id              (admin)

 TEAMS
   GET    /api/teams                        (public)
   GET    /api/teams?department=<id>        (public)
   GET    /api/teams/:id                    (public)
   POST   /api/teams                        (admin)
   PUT    /api/teams/:id                    (admin)
   PATCH  /api/teams/:id/progress           (admin — progress bar)
   DELETE /api/teams/:id                    (admin)
   POST   /api/teams/:id/members            (admin)
   DELETE /api/teams/:id/members/:memberId  (admin)

 PUBLICATIONS
   GET    /api/publications                 (public — approved only)
   GET    /api/publications/search?query=   (public — approved only)
   GET    /api/publications/stats           (public)
   GET    /api/publications/:id             (public — approved only)
   GET    /api/publications/:id/cite        (public — BibTeX / APA)
   POST   /api/publications                 (admin | member — submit)
   GET    /api/publications/pending         (admin — review queue)
   GET    /api/publications/all             (admin — all statuses)
   PUT    /api/publications/:id/approve     (admin)
   PUT    /api/publications/:id/reject      (admin)
   PUT    /api/publications/:id             (admin)
   DELETE /api/publications/:id             (admin)

 NEWS
   GET    /api/news                         (public)
   GET    /api/news/:id                     (public)
   POST   /api/news                         (admin)
   PUT    /api/news/:id                     (admin)
   DELETE /api/news/:id                     (admin)

 DASHBOARDS
   GET    /api/dashboard/admin              (admin)
   GET    /api/dashboard/admin/members      (admin)
   GET    /api/dashboard/head               (head_of_lab | admin)
   GET    /api/dashboard/head/members       (head_of_lab | admin)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
});

module.exports = app;