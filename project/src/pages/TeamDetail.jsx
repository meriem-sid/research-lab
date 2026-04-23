import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

const statusColors = { Active: "#059669", Planning: "#4F46E5", Completed: "#6B7280", "On Hold": "#D97706" };
const statusBg = { Active: "#ECFDF5", Planning: "#EEF2FF", Completed: "#F3F4F6", "On Hold": "#FFFBEB" };

export default function TeamDetail() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/teams/${id}`);
        setTeam(data.data);
      } catch (err) {
        console.error("Failed to fetch team:", err);
        setTeam(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTeam();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Loading team...</h2>
      </div>
    );
  }

  if (!team) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Team not found</h2>
        <Link to="/teams" style={{ color: "#4F46E5" }}>← Back to Teams</Link>
      </div>
    );
  }

  return (
    <main style={s.page}>
      <Link to="/teams" style={s.back}>← Back to Teams</Link>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <span style={s.deptBadge}>{team.department?.code || "---"}</span>
          <span style={s.dept}>{team.department?.name || ""}</span>
        </div>
        <h1 style={s.title}>{team.teamName}</h1>
        <p style={s.focus}>{team.researchFocus}</p>
        <p style={s.desc}>{team.description}</p>
      </div>

      {/* Leader */}
      <div style={s.leaderCard}>
        <div style={s.avatar}>{team.leaderName?.split(" ").map((w) => w[0]).slice(0, 2).join("") || "TL"}</div>
        <div>
          <div style={s.leaderLabel}>Team Leader</div>
          <div style={s.leaderName}>{team.leaderName}</div>
        </div>
      </div>

      {/* Progress */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Research Progress</h2>
        <div style={s.progressTop}>
          <span style={s.progressNote}>{team.progressNote}</span>
          <span style={s.progressPct}>{team.researchProgress ?? 0}%</span>
        </div>
        <div style={s.progressBar}><div style={{ ...s.progressFill, width: `${team.researchProgress ?? 0}%` }} /></div>
      </div>

      {/* Members */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Team Members</h2>
        <div style={s.memberGrid}>
          {team.teamMembers?.map((m) => (
            <div key={m._id || m.fullName} style={s.memberCard}>
              <div style={s.memberAvatar}>{m.fullName?.split(" ").map((w) => w[0]).slice(0,2).join("")}</div>
              <div style={s.memberName}>{m.fullName}</div>
              <span style={s.roleBadge}>{m.academicRole}</span>
              <div style={s.spec}>{m.specialization}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Active Projects</h2>
        <div style={s.projectList}>
          {team.activeProjects.map((p, idx) => (
            <div key={p._id || idx} style={s.projectCard}>
              <div style={s.projectTop}>
                <h3 style={s.projectTitle}>{p.title}</h3>
                <span style={{ ...s.statusBadge, color: statusColors[p.status], background: statusBg[p.status] }}>{p.status}</span>
              </div>
              <p style={s.projectDesc}>{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

const s = {
  page: { maxWidth: "900px", margin: "0 auto", padding: "3rem 1.5rem" },
  back: { color: "#4F46E5", textDecoration: "none", fontSize: "0.9rem", display: "inline-block", marginBottom: "2rem" },
  header: { marginBottom: "2rem" },
  headerTop: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" },
  deptBadge: { background: "#EEF2FF", color: "#4F46E5", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600 },
  dept: { color: "#6B7280", fontSize: "0.9rem" },
  title: { fontSize: "2rem", fontWeight: 800, color: "#111827", marginBottom: "0.5rem" },
  focus: { color: "#4F46E5", fontSize: "1rem", marginBottom: "0.75rem" },
  desc: { color: "#6B7280", lineHeight: 1.7 },
  leaderCard: { display: "flex", alignItems: "center", gap: "1rem", background: "#EEF2FF", padding: "1.25rem", borderRadius: "0.75rem", marginBottom: "2rem" },
  avatar: { width: "52px", height: "52px", borderRadius: "50%", background: "#4F46E5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem", flexShrink: 0 },
  leaderLabel: { fontSize: "0.75rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" },
  leaderName: { fontWeight: 600, color: "#111827", fontSize: "1rem" },
  section: { marginBottom: "2.5rem" },
  sectionTitle: { fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #EEF2FF" },
  progressTop: { display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" },
  progressNote: { fontSize: "0.875rem", color: "#6B7280" },
  progressPct: { fontWeight: 700, color: "#4F46E5" },
  progressBar: { height: "8px", background: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" },
  progressFill: { height: "100%", background: "#4F46E5", borderRadius: "9999px" },
  memberGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" },
  memberCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.25rem", textAlign: "center" },
  memberAvatar: { width: "48px", height: "48px", borderRadius: "50%", background: "#4F46E5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, margin: "0 auto 0.75rem" },
  memberName: { fontWeight: 600, color: "#111827", fontSize: "0.9rem", marginBottom: "0.4rem" },
  roleBadge: { background: "#EEF2FF", color: "#4F46E5", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600 },
  spec: { fontSize: "0.8rem", color: "#6B7280", marginTop: "0.4rem" },
  projectList: { display: "flex", flexDirection: "column", gap: "1rem" },
  projectCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1.25rem" },
  projectTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" },
  projectTitle: { fontWeight: 600, color: "#111827" },
  statusBadge: { padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600 },
  projectDesc: { fontSize: "0.875rem", color: "#6B7280" },
};
