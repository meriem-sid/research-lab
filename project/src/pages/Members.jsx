import { useState, useEffect } from "react";
import api from "../services/api";

const roles = ["Professor", "Doctor", "PhD Student", "Researcher", "Associate"];

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        // Fetch all members (not grouped) so orphaned members are visible too
        const { data } = await api.get("/members");
        const allMembers = (data.data || []).map((m) => ({
          ...m,
          team: m.team || "—",
        }));
        setMembers(allMembers);
      } catch (err) {
        console.error("Failed to fetch members:", err);
        if (err.response?.status === 429) {
          setError("Too many requests. Please wait a moment and refresh.");
        } else {
          setError(err.response?.data?.message || "Failed to load members. Please try again.");
        }
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (loading) {
    return (
      <main style={s.page}>
        <div style={s.header}>
          <h1 style={s.title}>Member Directory</h1>
          <p style={s.sub}>Loading members...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={s.page}>
        <div style={s.header}>
          <h1 style={s.title}>Member Directory</h1>
          <div style={s.errorBox}>
            <p style={{color: "#DC2626", marginBottom: "0.75rem"}}>{error}</p>
            <button style={s.retryBtn} onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </main>
    );
  }

  const grouped = roles.reduce((acc, role) => {
    acc[role] = members.filter((m) => m.academicRole === role);
    return acc;
  }, {});

  return (
    <main style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Member Directory</h1>
        <p style={s.sub}>Our researchers, faculty, and PhD students</p>
      </div>

      {roles.map((role) => (
        <section key={role} style={s.section}>
          <h2 style={s.roleTitle}>{role}s ({grouped[role].length})</h2>
          <div style={s.grid}>
            {grouped[role].map((m) => (
              <div key={m._id} style={s.card}>
                <div style={s.avatar}>{m.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
                <h3 style={s.name}>{m.fullName}</h3>
                <span style={s.roleBadge}>{m.academicRole}</span>
                <p style={s.spec}>{m.specialization}</p>
                <p style={s.team}>{m.team}</p>
                <div style={s.links}>
                  {m.linkedIn && <a href={m.linkedIn} target="_blank" rel="noreferrer" style={s.iconLink}>LinkedIn</a>}
                  {m.googleScholar && <a href={m.googleScholar} target="_blank" rel="noreferrer" style={s.iconLink}>Scholar</a>}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

const s = {
  page: { maxWidth: "1200px", margin: "0 auto", padding: "3rem 1.5rem" },
  header: { textAlign: "center", marginBottom: "2.5rem" },
  title: { fontSize: "2rem", fontWeight: 700, color: "#111827" },
  sub: { color: "#6B7280", marginTop: "0.5rem" },
  errorBox: { background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "0.5rem", padding: "1rem", maxWidth: "500px", margin: "0 auto" },
  retryBtn: { padding: "0.5rem 1rem", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontWeight: 500, fontSize: "0.875rem" },
  section: { marginBottom: "3rem" },
  roleTitle: { fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem", paddingBottom: "0.5rem", borderBottom: "2px solid #EEF2FF" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.5rem", textAlign: "center" },
  avatar: { width: "56px", height: "56px", borderRadius: "50%", background: "#4F46E5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.1rem", margin: "0 auto 0.75rem" },
  name: { fontWeight: 600, color: "#111827", fontSize: "1rem", marginBottom: "0.4rem" },
  roleBadge: { background: "#EEF2FF", color: "#4F46E5", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600 },
  spec: { fontSize: "0.85rem", color: "#6B7280", marginTop: "0.4rem" },
  team: { fontSize: "0.8rem", color: "#9CA3AF", marginTop: "0.25rem" },
  links: { display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "0.75rem" },
  iconLink: { color: "#4F46E5", fontSize: "0.8rem", textDecoration: "none", border: "1px solid #e5e7eb", padding: "0.2rem 0.6rem", borderRadius: "0.25rem" },
  tracker: { marginTop: "1rem", background: "#f9fafb", borderRadius: "0.5rem", padding: "0.75rem", textAlign: "left" },
  trackerLabel: { fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.05em", marginBottom: "0.4rem" },
  thesisTitle: { fontSize: "0.8rem", fontWeight: 600, color: "#111827", marginBottom: "0.4rem" },
  phaseBadge: { background: "#EEF2FF", color: "#4F46E5", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 600 },
  progressBar: { height: "6px", background: "#e5e7eb", borderRadius: "9999px", overflow: "hidden", margin: "0.5rem 0 0.25rem" },
  progressFill: { height: "100%", background: "#4F46E5", borderRadius: "9999px" },
  progressPct: { fontSize: "0.75rem", fontWeight: 600, color: "#4F46E5", textAlign: "right" },
  timeline: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", color: "#9CA3AF", marginTop: "0.4rem" },
  timelineArrow: { color: "#4F46E5" },
};
