import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";

function getAuthFromStorage() {
  try {
    const name = localStorage.getItem("userName");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      return { isLoggedIn: true, userName: name || "Researcher", userRole: user.role || "" };
    }
  } catch {
    // ignore malformed localStorage
  }
  return { isLoggedIn: false, userName: "", userRole: "" };
}

function AuthButtons({ mobile = false, isLoggedIn, userRole, userName, onLogout, onCloseMenu }) {
  const closeMenu = () => mobile && onCloseMenu();
  if (!isLoggedIn) {
    return (
      <>
        <Link to="/login" style={st.btnOutline} onClick={closeMenu}>Login</Link>
        <Link to="/register" style={st.btnPrimary} onClick={closeMenu}>Register</Link>
      </>
    );
  }
  if (userRole === "admin") {
    return (
      <>
        <Link to="/admin" style={st.dashboardLink} onClick={closeMenu}>Dashboard</Link>
        <button onClick={() => { closeMenu(); onLogout(); }} style={st.btnOutline}>Logout</button>
      </>
    );
  }
  return (
    <>
      <Link to="/profile" style={st.navLink} onClick={closeMenu}>Profile</Link>
      <span style={st.userName}>{userName}</span>
      <button onClick={() => { closeMenu(); onLogout(); }} style={st.btnOutline}>Logout</button>
    </>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  // Subscribe to route changes so the Navbar re-renders and re-reads localStorage after login/logout
  const _location = useLocation();
  void _location;

  // Re-read auth state on every render (localStorage is fast)
  const { isLoggedIn, userName, userRole } = getAuthFromStorage();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    }
    localStorage.clear();
    window.location.href = "/login";
  };

  const navLinks = [
    { name: "Home", to: "/" },
    { name: "Teams", to: "/teams" },
    { name: "Publications", to: "/publications" },
    { name: "Members", to: "/members" },
    { name: "News", to: "/news" },
  ];

  return (
    <header style={st.navbar}>
      <div style={st.container}>
        <Link to="/" style={st.logo}>Research Lab</Link>

        {/* Desktop Nav */}
        <nav style={st.nav}>
          {navLinks.map((l) => (
            <Link key={l.name} to={l.to} style={st.navLink}>{l.name}</Link>
          ))}
          {isLoggedIn && (userRole === "team_leader" || userRole === "member") && (
            <Link to="/my-work" style={st.myWorkLink}>My Work</Link>
          )}
        </nav>

        {/* Desktop Auth */}
        <div style={st.desktopAuth}>
          <AuthButtons
            isLoggedIn={isLoggedIn}
            userRole={userRole}
            userName={userName}
            onLogout={handleLogout}
            onCloseMenu={() => setMenuOpen(false)}
          />
        </div>

        {/* Hamburger */}
        <button style={st.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span style={st.bar} />
          <span style={st.bar} />
          <span style={st.bar} />
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div style={st.mobileMenu}>
          {navLinks.map((l) => (
            <Link key={l.name} to={l.to} style={st.mobileLink} onClick={() => setMenuOpen(false)}>{l.name}</Link>
          ))}
          {isLoggedIn && (userRole === "team_leader" || userRole === "member") && (
            <Link to="/my-work" style={st.mobileLink} onClick={() => setMenuOpen(false)}>My Work</Link>
          )}
          <div style={st.mobileAuthRow}>
            <AuthButtons
              mobile
              isLoggedIn={isLoggedIn}
              userRole={userRole}
              userName={userName}
              onLogout={handleLogout}
              onCloseMenu={() => setMenuOpen(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
}

const st = {
  navbar: {
    position: "sticky", top: 0, zIndex: 1000,
    background: "rgba(255,255,255,0.97)",
    borderBottom: "1px solid #e5e7eb",
    height: "64px",
  },
  container: {
    maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem",
    height: "100%", display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: "1rem",
  },
  logo: {
    fontWeight: 700, fontSize: "1.25rem",
    color: "#4F46E5", textDecoration: "none", flexShrink: 0,
  },
  nav: {
    display: "flex", alignItems: "center",
    gap: "1.5rem", flex: 1, justifyContent: "center",
  },
  navLink: {
    color: "#111827", textDecoration: "none",
    fontSize: "0.9rem", fontWeight: 500,
  },
  myWorkLink: {
    background: "#EEF2FF", color: "#4F46E5",
    padding: "0.35rem 0.9rem", borderRadius: "0.375rem",
    textDecoration: "none", fontSize: "0.875rem",
    fontWeight: 600, border: "1px solid #C7D2FE",
  },
  desktopAuth: {
    display: "flex", alignItems: "center",
    gap: "0.75rem", flexShrink: 0,
  },
  btnPrimary: {
    background: "#4F46E5", color: "#fff", padding: "0.45rem 1rem",
    borderRadius: "0.375rem", textDecoration: "none",
    fontSize: "0.875rem", fontWeight: 500,
    border: "none", cursor: "pointer",
  },
  btnOutline: {
    background: "transparent", color: "#111827",
    padding: "0.45rem 1rem", borderRadius: "0.375rem",
    textDecoration: "none", fontSize: "0.875rem",
    fontWeight: 500, border: "1px solid #d1d5db", cursor: "pointer",
  },
  dashboardLink: {
    background: "#4F46E5", color: "#fff",
    padding: "0.45rem 1.1rem", borderRadius: "0.375rem",
    textDecoration: "none", fontSize: "0.875rem", fontWeight: 600,
  },
  userName: {
    fontSize: "0.875rem", fontWeight: 600, color: "#111827",
  },
  hamburger: {
    display: "none", flexDirection: "column", gap: "4px",
    background: "none", border: "none", cursor: "pointer", padding: "0.5rem",
  },
  bar: {
    display: "block", width: "22px",
    height: "2px", background: "#111827", borderRadius: "2px",
  },
  mobileMenu: {
    display: "flex", flexDirection: "column", gap: "0.5rem",
    padding: "1rem 1.5rem", background: "#fff",
    borderTop: "1px solid #e5e7eb",
    position: "absolute", top: "64px", left: 0, right: 0,
    zIndex: 999, boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  mobileLink: {
    color: "#111827", textDecoration: "none",
    fontSize: "0.95rem", fontWeight: 500, padding: "0.4rem 0",
  },
  mobileAuthRow: {
    display: "flex", gap: "0.75rem", marginTop: "0.75rem",
    paddingTop: "0.75rem", borderTop: "1px solid #f3f4f6",
    flexWrap: "wrap",
  },
};
