import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const TITLES = ["Professor", "Doctor", "PhD Student", "Researcher", "Associate"];

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [degree, setDegree] = useState(null);
  const [degreeError, setDegreeError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") { 
      setDegreeError("Only PDF files are accepted"); 
      return; 
    }
    if (file.size > 5 * 1024 * 1024) { 
      setDegreeError("File must be under 5MB"); 
      return; 
    }
    setDegreeError("");
    const reader = new FileReader();
    reader.onload = () => setDegree({ name: file.name, data: reader.result });
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setTitleError("");
    
    if (!title) { 
      setTitleError("Please select your title"); 
      return; 
    }
    if (form.password !== form.confirm) { 
      setError("Passwords do not match"); 
      return; 
    }
    if (!degree) { 
      setError("Please upload your degree PDF"); 
      return; 
    }
    
    setLoading(true);

    try {
      // Map UI title to academicRole
      const academicRoleMap = {
        "Professor": "Professor",
        "Doctor": "Doctor",
        "PhD Student": "PhD Student",
        "Researcher": "Researcher",
        "Associate": "Associate"
      };

      await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        title: title, // Frontend uses 'title', backend accepts it
        academicRole: academicRoleMap[title],
        degree: degree, // { name, data } base64 PDF
      });

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.message || err.message || "Registration failed. Please try again.";
      setError(message);
    }
  };

  if (success) return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Registration Submitted</h1>
        <div style={s.successBanner}>
          Your account and degree document are awaiting admin review. You'll be notified once approved.
        </div>
        <Link to="/login" style={s.backLink}>Return to Login</Link>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Create Account</h1>
        <p style={s.sub}>Join our research community</p>

        <form onSubmit={handleSubmit} style={s.form}>
          {[ ["Full Name", "text", "name"], ["Email", "email", "email"], ["Password", "password", "password"], ["Confirm Password", "password", "confirm"] ].map(([label, type, key]) => (
            <div key={key} style={s.group}>
              <label style={s.label}>{label}</label>
              <input style={s.input} type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
            </div>
          ))}

          <div style={s.group}>
            <label style={s.label}>Title <span style={s.required}>*</span></label>
            <div style={s.titleGrid}>
              {TITLES.map((t) => (
                <button
                  key={t}
                  type="button"
                  style={{ ...s.titleBtn, ...(title === t ? s.titleBtnActive : {}) }}
                  onClick={() => setTitle(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {titleError && <div style={s.fieldError}>{titleError}</div>}
          </div>

          <div style={s.group}>
            <label style={s.label}>
              Degree Certificate <span style={s.required}>*</span>
              <span style={s.hint}> (PDF only, max 5MB)</span>
            </label>
            <label style={s.uploadBox}>
              <input type="file" accept=".pdf" onChange={handleFile} style={{ display: "none" }} />
              {degree ? (
                <div style={s.uploadedFile}>
                  <span style={s.fileName}>{degree.name}</span>
                  <span style={s.changeFile}>Change</span>
                </div>
              ) : (
                <div style={s.uploadPlaceholder}>
                  <span style={s.uploadText}>Click to upload your degree PDF</span>
                </div>
              )}
            </label>
            {degreeError && <div style={s.fieldError}>{degreeError}</div>}
          </div>

          {error && <div style={s.error}>{error}</div>}
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? "Submitting..." : "Create Account"}
          </button>
        </form>

        <p style={s.footer}>
          Already have an account? <Link to="/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", background: "#EEF2FF" },
  card: { background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", padding: "2.5rem", width: "100%", maxWidth: "460px" },
  icon: { fontSize: "2.5rem", textAlign: "center", marginBottom: "0.75rem" },
  title: { fontSize: "1.5rem", fontWeight: 700, color: "#111827", textAlign: "center", marginBottom: "0.25rem" },
  sub: { color: "#6B7280", textAlign: "center", fontSize: "0.9rem", marginBottom: "1.75rem" },
  form: { display: "flex", flexDirection: "column", gap: "1.1rem" },
  group: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.875rem", fontWeight: 500, color: "#111827" },
  required: { color: "#DC2626" },
  hint: { color: "#9CA3AF", fontWeight: 400, fontSize: "0.8rem" },
  input: { padding: "0.6rem 1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none" },
  titleGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" },
  titleBtn: { padding: "0.55rem 0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#fff", color: "#374151", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, textAlign: "center", transition: "all 0.15s" },
  titleBtnActive: { background: "#4F46E5", color: "#fff", border: "1px solid #4F46E5" },
  uploadBox: { display: "block", border: "2px dashed #C7D2FE", borderRadius: "0.5rem", padding: "1.25rem", cursor: "pointer" },
  uploadPlaceholder: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" },
  uploadIcon: { fontSize: "1.5rem" },
  uploadText: { fontSize: "0.875rem", color: "#6B7280" },
  uploadedFile: { display: "flex", alignItems: "center", gap: "0.75rem" },
  pdfIcon: { fontSize: "1.25rem" },
  fileName: { fontSize: "0.875rem", color: "#111827", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  changeFile: { fontSize: "0.75rem", color: "#4F46E5", fontWeight: 500 },
  fieldError: { fontSize: "0.8rem", color: "#DC2626" },
  error: { background: "#fef2f2", border: "1px solid #fecaca", color: "#DC2626", padding: "0.65rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" },
  btn: { padding: "0.7rem", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: 500, cursor: "pointer", fontSize: "0.95rem" },
  successBanner: { background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#059669", padding: "1rem", borderRadius: "0.5rem", textAlign: "center", fontSize: "0.875rem", margin: "1rem 0" },
  backLink: { display: "block", textAlign: "center", color: "#4F46E5", textDecoration: "none", fontWeight: 500, marginTop: "1rem" },
  footer: { textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "#6B7280" },
  link: { color: "#4F46E5", fontWeight: 600, textDecoration: "none" },
};
