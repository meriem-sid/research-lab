# Research Lab — Full Technical Audit Report

**Project:** Laboratoire-AC (Research Lab Management System)
**Audit Date:** 2026-04-23
**Auditor:** Senior Full-Stack Engineer / QA
**Scope:** Backend (`laboratoire-ac/server/`) + Frontend (`project/src/`)

---

## 1. Project Overview

A MERN-stack web application for managing a research laboratory. It supports multi-role user accounts (visitor, member, team leader, head of lab, admin) with a full approval-based registration workflow.

### Main Features
- **Authentication & Authorization:** Self-registration with admin approval, JWT (cookie-based), role-based access control (RBAC).
- **Members / Users:** Member profiles, PhD degree verification, PhD progress tracker.
- **Teams & Departments:** Team creation with leader assignment, member allocation, active projects, task management.
- **Publications:** Publication library with search, filtering, BibTeX/APA citation export, and an admin approval workflow.
- **News / Announcements:** Admin-posted news feed with categories.
- **Dashboards:** Admin dashboard (stats + queues), Head-of-Lab read-only dashboard.
- **My Work:** Role-differentiated workspace where team leaders manage projects/tasks/members and members submit task deliverables.

### Tech Stack
| Layer | Technology |
|-------|------------|
| Backend Runtime | Node.js + Express |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (httpOnly cookie + Bearer fallback), bcryptjs |
| Frontend | React 18 + Vite + React Router (BrowserRouter) |
| HTTP Client | Axios |
| Styling | Inline styles (no CSS-in-JS or Tailwind) |

---

## 2. Architecture Summary

### Backend Structure
```
server/
├── index.js              — Express app, global middleware, route mounts
├── config/db.js          — MongoDB connection
├── middleware/
│   ├── auth.js           — protect() JWT verification, authorise() role guard
│   └── errorHandler.js   — Centralized Express error handler
├── models/
│   ├── User.js           — Auth account + _registrationMeta
│   ├── Member.js         — Lab member profile (academic role, thesis, degree)
│   ├── Team.js           — Team + activeProjects[] (embedded project/task schema)
│   ├── Publication.js    — Publication + approval workflow
│   ├── Department.js     — Department with optional headOfDepartment
│   └── News.js           — News article
├── controllers/          — Business logic for each domain
└── routes/               — Express routers mapping endpoints to controllers
```

### Frontend Structure
```
project/src/
├── App.jsx               — Routing table (NO protected routes)
├── main.jsx              — React root (StrictMode)
├── services/api.js       — Axios instance (withCredentials, 401 interceptor)
├── lib/fakeData.js       — Static demo data (unused in production paths)
├── pages/
│   ├── Home.jsx          — Landing with stats, news, pubs, departments
│   ├── Login.jsx         — Email/password login
│   ├── Register.jsx      — Self-registration with PDF upload
│   ├── Admin.jsx         — Admin dashboard (client-side role gate only)
│   ├── MyWork.jsx        — Team leader / member workspace
│   ├── Profile.jsx       — Edit own account + member profile
│   ├── Teams.jsx         — Team listing with department filter
│   ├── TeamDetail.jsx    — Single team view
│   ├── Publications.jsx  — Publication library + post modal
│   ├── Members.jsx       — Member directory (grouped by team)
│   ├── News.jsx          — News feed
│   └── NewsArticle.jsx   — Single news article
└── components/
    ├── Navbar.jsx        — Navigation + auth state
    ├── Footer.jsx        — Site footer
    └── SearchableSelect.jsx — Custom dropdown component
```

### Data Flow
1. Frontend runs on Vite dev server (`localhost:5173` by default).
2. Backend runs on port `5000` with CORS origin set to `http://localhost:5173`.
3. Authentication is stateless JWT stored in an **httpOnly cookie**; frontend also reads a `user` object from `localStorage` for UI decisions.
4. API base URL defaults to `/api` on the frontend, requiring a dev proxy or same-origin deployment.

---

## 3. Issues Found

### 🔴 CRITICAL

| # | Issue | File(s) | Impact |
|---|-------|---------|--------|
| C1 | **JWT_SECRET is an actual JWT token, not a cryptographically random secret.** The `.env` value `eyJhbGciOiJIUzI1NiIs...` is a valid JWT payload. Anyone can decode it and the signature is effectively public. | `server/.env` | Complete auth compromise — attacker can forge tokens. |
| C2 | **No frontend route guards.** `/admin`, `/my-work`, and `/profile` are reachable by direct URL navigation regardless of auth state or role. The UI relies solely on localStorage checks, which are trivial to bypass. | `project/src/App.jsx` | Unauthorized access to admin UI, information leakage, confused user experience. |
| C3 | **Client-side admin gate only.** `Admin.jsx` checks `user.role !== "admin"` with localStorage data and redirects; the page layout still renders briefly, and the check is bypassable. | `project/src/pages/Admin.jsx` | Same as C2 — admin interface exposed. |

### 🟠 HIGH

| # | Issue | File(s) | Impact |
|---|-------|---------|--------|
| H1 | **Missing "Associate" in academicRoleMap.** `Register.jsx` maps UI titles to backend roles, but `"Associate"` is missing from the map, so it becomes `undefined` on submit. | `project/src/pages/Register.jsx` | Invalid registration payload; may fail validation or store bad data. |
| H2 | **Publication abstract sent as title.** `handlePost` in `Publications.jsx` sends `abstract: postForm.title` instead of a real abstract field. | `project/src/pages/Publications.jsx` | Data corruption — all submitted publications have title duplicated as abstract. |
| H3 | **Members page only shows members inside teams.** `Members.jsx` calls `/members?grouped=true`, which returns **teams** with nested members. Members who are not assigned to any team are completely invisible. | `project/src/pages/Members.jsx` | Orphaned members missing from directory. |
| H4 | **Admin pending registration UI reads wrong fields.** The code renders `r.title` and `r.degree`, but the backend `User` model stores these inside `_registrationMeta.academicRole` and `_registrationMeta.degree`. | `project/src/pages/Admin.jsx` | Admin cannot see applicant title or preview degree; UI appears broken. |
| H5 | **No input validation middleware on backend.** All `POST`/`PUT` bodies go directly to Mongoose without express-validator, Joi, or zod. Malformed payloads, extra fields, and injection attempts are not sanitized. | All backend routes | XSS, NoSQL injection, and schema pollution risks. |
| H6 | **Frontend publication type dropdown only shows 3 of 6 backend types.** Backend accepts `Journal Article`, `Conference Paper`, `Book Chapter`, `Thesis`, `Technical Report`, `Preprint`. Frontend only lists the first 3. | `project/src/pages/Publications.jsx` | Users cannot submit `Thesis`, `Technical Report`, or `Preprint` from the UI. |
| H7 | **Admin member status toggle assumes `m.user` exists.** In `manage-members`, the toggle button calls `api.put(/auth/users/${m.user?._id}...)`. If a member has no linked user, this becomes `api.put("/auth/users/undefined")`. | `project/src/pages/Admin.jsx` | Broken request, potential 404/500, no user feedback on failure. |
| H8 | **Home.jsx fires 4 independent API calls on mount.** Under slow networks or rate-limit window exhaustion, the page can partially load with mixed success/failure states. | `project/src/pages/Home.jsx` | Degraded UX, multiple error banners. |
| H9 | **Rate limiter max = 2000 / 15 min (~2 req/s).** While reasonable, rapid navigation across pages that each make multiple API calls (e.g., Home + Admin) can exhaust the budget, causing 429 errors for legitimate users. | `server/index.js` | Legitimate users locked out temporarily. |

### 🟡 MEDIUM

| # | Issue | File(s) | Impact |
|---|-------|---------|--------|
| M1 | **Profile page does not re-fetch after saving.** After a successful save, stale data remains in form state until manual refresh. | `project/src/pages/Profile.jsx` | User confusion; changes appear to not persist. |
| M2 | **News client-side pagination ignores API pagination.** `News.jsx` fetches ALL news items and paginates in memory. API supports `?page=&limit=` but frontend never uses it. | `project/src/pages/News.jsx` | Performance degradation as news archive grows. |
| M3 | **Publications client-side search/filter instead of backend search.** The backend has a full-text search endpoint (`/publications/search?query=`) and server-side filters; frontend downloads the entire approved list and filters locally. | `project/src/pages/Publications.jsx` | Poor performance at scale; unnecessary bandwidth. |
| M4 | **Citation generation duplicated across frontend and backend.** Frontend defines `getBibTeX`/`getAPA` inline; backend has `/publications/:id/cite`. Discrepancies will appear if either logic changes. | `project/src/pages/Publications.jsx`, `server/controllers/publicationController.js` | Maintenance burden, inconsistent output. |
| M5 | **Frontend `postedPubs` sidebar mixes localStorage with API data.** Submitted publications are stored in `localStorage` under `"postedPublications"` and displayed in a sidebar, but this cache is never invalidated or synced with the real backend state. | `project/src/pages/Publications.jsx` | Stale/misleading submission status shown to users. |
| M6 | **SearchableSelect lacks keyboard accessibility.** No arrow-key navigation, Enter/Space selection, or Escape-to-close. Not usable by keyboard-only or screen-reader users. | `project/src/components/SearchableSelect.jsx` | Accessibility (a11y) violation. |
| M7 | **Team leader guard in backend compares `req.user.memberProfile` to `team.leaderId`.** `leaderId` is a `Member` ObjectId. If `req.user.memberProfile` is not populated (string vs ObjectId mismatch), the strict `String()` comparison works, but this is fragile. | `server/controllers/teamController.js` | Potential false negatives if types mismatch in future. |
| M8 | **BibTeX key generation assumes multi-word author names.** `const key = `${authors[0].trim().split(" ").pop()}${year}`` will produce just the year for single-name authors. | `server/controllers/publicationController.js` | Invalid BibTeX keys. |
| M9 | **Admin.jsx team creation form doesn't ensure leader is in `teamMembers`.** Backend `Team` schema has separate `leaderId` and `teamMembers` arrays. Nothing enforces the leader being a member of the team. | `project/src/pages/Admin.jsx` | Semantic inconsistency in team data. |
| M10 | **TeamDetail.jsx uses `p.title` as React key for activeProjects.** If two projects have the same title (or empty title), React will emit duplicate-key warnings and reconciliation bugs. | `project/src/pages/TeamDetail.jsx` | React rendering bugs. |
| M11 | **Publications sidebar status badge logic is binary.** It only shows "Pending" or "Rejected", never "Approved", because the localStorage cache does not reflect backend approval. | `project/src/pages/Publications.jsx` | Misleading UI. |
| M12 | **Frontend API interceptor wipes auth on any 401 but doesn't distinguish token expiry vs. bad credentials.** A malformed request that returns 401 (e.g., wrong password on login) will incorrectly clear localStorage and force a redirect. | `project/src/services/api.js` | Overly aggressive logout on login failure. |
| M13 | **Global 401 interceptor triggers on failed login attempts.** When a user submits wrong credentials, the backend returns 401; the interceptor then reloads the page with `window.location.href = '/login?reason=unauthorized'`, preventing the Login page from displaying the error message. | `project/src/services/api.js`, `project/src/pages/Login.jsx` | Login UX broken — users never see "Invalid credentials". |
| M14 | **Database connection crashes process on first failure.** `connectDB` calls `process.exit(1)` immediately if MongoDB is unreachable. No retry/backoff logic for cloud/container deployments. | `server/config/db.js` | Service crash loops instead of resilient recovery. |

### 🟢 LOW

| # | Issue | File(s) | Impact |
|---|-------|---------|--------|
| L1 | **Missing dedicated 404 page.** Unknown routes fall through to the footer with no content. | `project/src/App.jsx` | Poor UX for broken links. |
| L2 | **Frontend `user` object in localStorage can be manually edited.** Since role-based UI decisions rely on it, a user can set `"role": "admin"` and see admin tabs (though API will still 403). | `project/src/components/Navbar.jsx` | UI confusion, minor info leakage of nav items. |
| L3 | **Email regex in User model is simplistic.** `/^\S+@\S+\.\S+$/` allows invalid addresses like `a@b.c` and rejects some valid RFC-compliant addresses. | `server/models/User.js` | Weak email validation. |
| L4 | **No helmet, no mongo-sanitize, no xss-clean middleware.** Standard Express security packages are absent. | `server/index.js` | Missing defense-in-depth headers and sanitization. |
| L5 | **No API request debouncing on search input in Publications.** Every keystroke within the 500ms debounce still triggers a re-render; the actual fetch is debounced, but the filter recomputation runs every keystroke. | `project/src/pages/Publications.jsx` | Minor UI jitter. |
| L6 | **NewsArticle image has fixed height without fallback.** If `article.image` is empty string or broken URL, a broken image icon shows. | `project/src/pages/NewsArticle.jsx` | Minor visual bug. |
| L7 | **App.jsx uses inline styles for layout minHeight instead of CSS.** Makes responsive adjustments harder and bloats JSX. | `project/src/App.jsx` | Maintainability. |
| L8 | **No testing infrastructure.** Neither frontend nor backend has test frameworks configured (Jest, Vitest, Mocha, Cypress, Playwright). Backend `npm test` exits with an error. | `project/package.json`, `server/package.json` | No automated regression safety net. |

---

## 4. Recommended Fixes

### Critical (Do Before Any Deployment)

1. **Regenerate JWT_SECRET**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Replace the token-like value in `.env` with the resulting hex string. Rotate any existing tokens in production.

2. **Add Frontend Protected Routes**
   Create a `ProtectedRoute` component:
   ```jsx
   // components/ProtectedRoute.jsx
   import { Navigate } from "react-router-dom";
   export default function ProtectedRoute({ children, allowedRoles = [] }) {
     const user = JSON.parse(localStorage.getItem("user") || "{}");
     if (!user?.id) return <Navigate to="/login" replace />;
     if (allowedRoles.length && !allowedRoles.includes(user.role)) {
       return <Navigate to="/" replace />;
     }
     return children;
   }
   ```
   Wrap sensitive routes in `App.jsx`:
   ```jsx
   <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><Admin /></ProtectedRoute>} />
   <Route path="/my-work" element={<ProtectedRoute allowedRoles={["member","team_leader"]}><MyWork /></ProtectedRoute>} />
   <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
   ```

3. **Correct Admin Pending Registration Field Paths**
   In `Admin.jsx`:
   - Change `r.title` → `r._registrationMeta?.academicRole`
   - Change `r.degree` → `r._registrationMeta?.degree`
   - Change `degreeModal` usage to match nested shape.

### High Priority

4. **Fix Register Academic Role Map**
   ```js
   const academicRoleMap = {
     Professor: "Professor",
     Doctor: "Doctor",
     "PhD Student": "PhD Student",
     Researcher: "Researcher",
     Associate: "Associate", // ADD THIS
   };
   ```

5. **Fix Publication Abstract Submission**
   Add an `abstract` textarea to the post modal and send:
   ```js
   abstract: postForm.abstract.trim() || postForm.title.trim(),
   ```
   instead of blindly duplicating the title.

6. **Fix Members Directory to Show All Members**
   Change the fetch strategy in `Members.jsx`:
   ```js
   const { data } = await api.get("/members"); // remove ?grouped=true
   setMembers(data.data || []);
   ```
   If grouping by academic role is desired, group on the frontend using `data.data`.

7. **Add Backend Input Validation**
   Install and configure `express-validator` (or Zod) on all mutation routes (`POST`, `PUT`, `PATCH`). Example for `/api/auth/register`:
   ```js
   body("email").isEmail().normalizeEmail(),
   body("password").isLength({ min: 6 }),
   body("name").trim().notEmpty(),
   ```

8. **Defend Against Missing User in Admin Member Toggle**
   ```jsx
   const userId = m.user?._id;
   if (!userId) return showToast("No user account linked to this member");
   await api.put(`/auth/users/${userId}`, { isActive: nextActive });
   ```

9. **Add Publication Types to Dropdown**
   ```jsx
   {["Journal Article", "Conference Paper", "Book Chapter", "Thesis", "Technical Report", "Preprint"].map(...)}
   ```

### Medium Priority

10. **Re-fetch Profile After Save**
    In `Profile.jsx` `handleSave`, after successful updates, call `fetchProfile()` again to refresh state from the server.

11. **Enable Server-Side Pagination for News**
    Update `News.jsx` to use `?page=${page}&limit=${PER_PAGE}` and manage `totalPages` from the API response.

12. **Use Backend Citation Endpoint**
    Replace frontend `getBibTeX`/`getAPA` with:
    ```js
    const { data } = await api.get(`/publications/${pub._id}/cite?format=${citeTab}`);
    ```
    This centralizes citation logic.

13. **Add Express Security Middleware**
    ```js
    const helmet = require("helmet");
    const mongoSanitize = require("express-mongo-sanitize");
    app.use(helmet());
    app.use(mongoSanitize());
    ```

14. **Add A11y to SearchableSelect**
    Implement `onKeyDown` handlers for ArrowUp/ArrowDown, Enter, Escape, and add `role="listbox"` / `role="option"` attributes.

15. **Remove localStorage `postedPubs` Cache**
    Rely entirely on the backend for publication submission state. Show a "My Submissions" tab that fetches from `/publications/all` or a new `/publications/my-submissions` endpoint.

16. **Fix 401 Interceptor to Exclude Login/Register Endpoints**
    In `api.js`, skip the redirect logic for auth routes:
    ```js
    api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const url = error.config?.url || "";
          if (url.includes("/auth/login") || url.includes("/auth/register")) {
            return Promise.reject(error); // Let Login/Register handle their own errors
          }
          localStorage.removeItem("user");
          localStorage.removeItem("userName");
          window.location.href = "/login?reason=unauthorized";
        }
        return Promise.reject(error);
      }
    );
    ```

17. **Add MongoDB Connection Retry Logic**
    In `config/db.js`, replace `process.exit(1)` with an exponential backoff retry (e.g., 3–5 retries) before terminating. This prevents immediate crashes in container orchestrators.

---

## 5. Testing Checklist

### 🔐 Authentication

| Step | Expected Result | Possible Failure |
|------|-----------------|------------------|
| Register with valid data (all fields + PDF) | Account created, status pending, success message shown | Backend 400/500, PDF size/type not caught, no success state |
| Register with existing email | Clear error: "An account with this email already exists" | 500 error, duplicate inserted, no user feedback |
| Register without selecting Title | Client-side validation blocks submit | Form submits with `undefined` role, backend rejects or stores bad data |
| Register with "Associate" title | Backend receives `"Associate"` | Receives `undefined` due to missing map entry |
| Login with approved account | JWT cookie set, redirected by role | Cookie not set (CORS/credentials mismatch), infinite login loop |
| Login with pending account | Error: "Your registration is pending admin approval" | Generic 401, user confused |
| Login with rejected account | Error shows rejection reason if provided | Generic 403, no reason shown |
| Login with wrong password | Error: "Invalid credentials" | localStorage wiped by global 401 interceptor |
| Logout | Cookie cleared, localStorage cleared, redirected to `/login` | Cookie remains, page refresh re-authenticates unexpectedly |
| Access `/admin` as non-admin | Redirected to `/login` or `/` | Admin page renders briefly, API calls 403, empty/broken UI |
| Access `/my-work` as visitor | Redirected to `/login` | Page renders, shows "No projects assigned" |
| Token expiry | User redirected to login with message | Silent failures, stale data displayed |

### 👤 Users / Members

| Step | Expected Result | Possible Failure |
|------|-----------------|------------------|
| Fetch all members (public) | Returns array with all member profiles | `grouped=true` omits members without teams |
| Fetch member by ID | Returns member + linked team | 404 for valid ID, missing population |
| Update own profile (member) | Updates allowed fields, rejects `academicRole` change | Member can override restricted fields if backend `delete` missed |
| Admin creates member directly | Member doc created, optionally linked to user | Missing required fields cause 500 instead of 400 |
| Upload PhD degree URL | Resets `phdDegreeVerified` to false | Verification status remains true, allowing fake degrees |
| Admin verifies degree | Sets `verified=true`, records timestamp & admin ID | No audit trail, concurrent overwrite |
| Delete member (admin) | Member removed, pulled from all teams/projects, user unlinked | Orphaned references in teams, dangling `memberProfile` on User |

### 👥 Teams

| Step | Expected Result | Possible Failure |
|------|-----------------|------------------|
| Create team (admin) | Team created with leader, members, department | `leaderId` not in `teamMembers`, invalid ObjectId causes CastError |
| Add member to team | Member appears in `teamMembers` | Duplicate members added if frontend allows double-click |
| Remove member from team | Member removed, still exists in DB | Cascade not handled for project members |
| Update team progress | Progress bar updates (0–100) | Value >100 accepted if frontend bypassed |
| Assign project member (team leader) | Only team members can be added | Non-team member added if frontend sends wrong ID |
| Add task to project | Task appended to project.tasks[] | Empty description accepted if frontend validation skipped |
| Member submits task file | `submitted=true`, fileData stored | Large base64 fileData exceeds MongoDB 16MB doc limit |

### 📰 Publications

| Step | Expected Result | Possible Failure |
|------|-----------------|------------------|
| Create publication (member) | Status pending, visible in "My Submissions" | Abstract saved as title (H2), wrong type enum |
| Approve publication (admin) | Becomes publicly visible in `/publications` | Still hidden due to `isPublished` desync |
| Reject publication (admin) | Status rejected, not visible, reason stored | Rejected pub still appears if cached in frontend localStorage |
| Search publications | Returns relevant results sorted by text score | No results if MongoDB text index not built |
| Export citation (BibTeX/APA) | Valid formatted citation returned | Wrong author formatting, missing DOI/link, invalid BibTeX key |
| Filter by year/type/team | Results filtered correctly | Frontend filters only loaded subset, missing non-loaded pages |

### 🧭 Navigation / UI

| Step | Expected Result | Possible Failure |
|------|-----------------|------------------|
| Admin tabs visibility | Dashboard link shown only for admin | Link visible to all if localStorage tampered |
| My Work tab visibility | Shown for member and team_leader | Hidden for team_leader if check is wrong |
| Mobile hamburger menu | Opens/closes, links navigate | Menu stays open, clicks pass through |
| News pagination | Pages navigate correctly | Client-side only; large dataset causes memory issues |

### ⚡ API & Performance

| Step | Expected Result | Possible Failure |
|------|-----------------|------------------|
| Rapid page switching | No 429 errors under normal use | 429 triggered if Home + Admin loaded quickly |
| Large publication list | Loads quickly with pagination | All docs fetched at once, UI freezes |
| Team with many projects | Renders without timeout | Embedded arrays grow unbounded, document size limit approached |
| Base64 PDF upload at registration | Stored in `_registrationMeta.degree` | Exceeds 2MB JSON limit or 16MB doc limit, causes 413/500 |

### ❗ Edge Cases

| Step | Expected Result | Possible Failure |
|------|-----------------|------------------|
| Empty team name | Rejected with validation error | Empty string stored |
| Invalid MongoDB ObjectId in URL | 404 "Resource not found" | 500 CastError leaked to client |
| Server down | Frontend shows graceful error | Blank page, uncaught exception |
| Double-submit registration | Second request rejected (duplicate email) | Race condition creates duplicate accounts |
| Member deleted while logged in | Subsequent requests 401 | Token still valid, user gets generic errors |

---

## 6. Final Evaluation

| Category | Score | Notes |
|----------|-------|-------|
| **Architecture** | 7/10 | Clean separation of concerns, good use of Mongoose subdocuments for projects/tasks. Missing service layer abstraction. |
| **Security** | 4/10 | JWT secret is compromised, no input sanitization, no helmet, no frontend route guards. Cookie security flags are correct. |
| **Backend Robustness** | 6/10 | Good error handler, rate limiting present, cascade delete logic partially implemented. Missing validation middleware. |
| **Frontend Quality** | 5/10 | Functional UI with inline styles. Missing protected routes, accessibility issues, stale data patterns, localStorage abuse. |
| **API Design** | 7/10 | RESTful, consistent response envelope (`{ success, data, message }`), good separation of public vs admin endpoints. |
| **Testing Readiness** | 4/10 | No unit tests, no integration tests, no e2e tests visible. Manual QA required. |
| **Production Readiness** | **NOT READY** | Critical security flaws (C1, C2) and multiple high-severity data integrity bugs (H1–H4) must be resolved before production deployment. |

### Blockers to Production
1. **JWT_SECRET must be regenerated immediately.**
2. **Frontend route guards must be implemented.**
3. **Backend input validation must be added.**
4. **Critical data mapping bugs (H1–H4) must be fixed.**

Once the Critical and High issues are resolved, the project will be suitable for a controlled staging environment with monitoring and automated tests added subsequently.

---

*End of Report*
