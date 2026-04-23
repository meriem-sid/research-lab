import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main style={{ textAlign: "center", padding: "6rem 1.5rem" }}>
      <h1 style={{ fontSize: "4rem", fontWeight: 800, color: "#4F46E5", marginBottom: "1rem" }}>404</h1>
      <p style={{ fontSize: "1.25rem", color: "#374151", marginBottom: "2rem" }}>Page not found.</p>
      <Link to="/" style={{ color: "#4F46E5", fontWeight: 600, textDecoration: "none", fontSize: "1rem" }}>
        ← Back to Home
      </Link>
    </main>
  );
}
