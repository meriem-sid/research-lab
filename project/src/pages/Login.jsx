import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const { data } = await api.post("/auth/login", { email, password });
      
      // Store user info (token is now in httpOnly cookie)
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userName", data.user.name);
      
      // Redirect based on role
      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.message || err.message || "Login failed. Please try again.";
      setError(message);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Welcome Back</h1>
        <p style={s.sub}>Sign in to your account</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.group}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" placeholder="you@lab.dz" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={s.group}>
            <label style={s.label}>Password</label>
            <div style={s.passwordWrap}>
              <input
                style={{ ...s.input, width: "100%", boxSizing: "border-box", paddingRight: "2.8rem" }}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                style={s.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <div style={s.error}>{error}</div>}
          <button type="submit" style={s.btn} disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
        </form>

        <p style={s.footer}>Don't have an account? <Link to="/register" style={s.link}>Register here</Link></p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", background: "#EEF2FF" },
  card: { background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", padding: "2.5rem", width: "100%", maxWidth: "420px" },
  icon: { fontSize: "2.5rem", textAlign: "center", marginBottom: "0.75rem" },
  title: { fontSize: "1.5rem", fontWeight: 700, color: "#111827", textAlign: "center", marginBottom: "0.25rem" },
  sub: { color: "#6B7280", textAlign: "center", fontSize: "0.9rem", marginBottom: "1.75rem" },
  form: { display: "flex", flexDirection: "column", gap: "1.1rem" },
  group: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.875rem", fontWeight: 500, color: "#111827" },
  input: { padding: "0.6rem 1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", fontSize: "0.875rem" },
  error: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.65rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" },
  btn: { padding: "0.7rem", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: 500, cursor: "pointer", fontSize: "0.95rem", marginTop: "0.25rem" },
  passwordWrap: { position: "relative", width: "100%" },
  eyeBtn: { position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" },
  footer: { textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "#6B7280" },
  link: { color: "#4F46E5", fontWeight: 600, textDecoration: "none" },
};
