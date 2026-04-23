import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Teams() {
  const [dept, setDept] = useState("All");
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamsAndDepts = async () => {
      try {
        setLoading(true);
        const [teamsRes, deptsRes] = await Promise.all([
          api.get("/teams"),
          api.get("/departments"),
        ]);

        setTeams(teamsRes.data.data || []);
        setDepartments(deptsRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch teams/departments:", err);
        setTeams([]);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamsAndDepts();
  }, []);

  const filtered = dept === "All" ? teams : teams.filter((t) => t.department?.name === dept || t.department?.code === dept);

  if (loading) {
    return (
      <main style={s.page}>
        <div style={s.header}>
          <h1 style={s.title}>Research Teams</h1>
          <p style={s.sub}>Loading teams...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Research Teams</h1>
        <p style={s.sub}>Explore our specialized research groups and their work</p>
      </div>

      <div style={s.filterBar}>
        {["All", ...departments.map((d) => d.name)].map((d) => (
          <button key={d} onClick={() => setDept(d)} style={{ ...s.filterBtn, ...(dept === d ? s.filterActive : {}) }}>{d}</button>
        ))}
      </div>

      <div style={s.grid}>
        {filtered.map((team) => (
          <Link to={`/teams/${team._id}`} key={team._id} style={s.card}>
            <div style={s.cardTop}>
              <span style={s.deptBadge}>{team.department?.code || "---"}</span>
              <span style={s.memberCount}>{team.teamMembers?.length || 0} members</span>
            </div>
            <h2 style={s.teamName}>{team.teamName}</h2>
            <p style={s.leader}>Led by {team.leaderName}</p>
            <p style={s.focus}>{team.researchFocus}</p>

            {/* Research Progress */}
            <div style={s.progressWrap}>
              <div style={s.progressTop}>
                <span style={s.progressLabel}>Research Progress</span>
                <span style={s.progressPct}>{team.researchProgress || 0}%</span>
              </div>
              <div style={s.progressBar}>
                <div style={{ ...s.progressFill, width: `${team.researchProgress || 0}%` }} />
              </div>
              {team.progressNote && <p style={s.progressNote}>{team.progressNote}</p>}
            </div>

            <div style={s.tags}>{team.tags?.map((t) => <span key={t} style={s.tag}>{t}</span>)}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}

const s = {
  page: { maxWidth: "1200px", margin: "0 auto", padding: "3rem 1.5rem" },
  header: { textAlign: "center", marginBottom: "2rem" },
  title: { fontSize: "2rem", fontWeight: 700, color: "#111827" },
  sub: { color: "#6B7280", marginTop: "0.5rem" },
  filterBar: { display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem", justifyContent: "center" },
  filterBtn: { padding: "0.4rem 1rem", borderRadius: "9999px", border: "1px solid #e5e7eb", background: "#fff", color: "#6B7280", cursor: "pointer", fontSize: "0.875rem" },
  filterActive: { background: "#4F46E5", color: "#fff", border: "1px solid #4F46E5" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.5rem" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.5rem", textDecoration: "none", color: "inherit", display: "block" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" },
  deptBadge: { background: "#EEF2FF", color: "#4F46E5", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600 },
  memberCount: { fontSize: "0.8rem", color: "#6B7280" },
  teamName: { fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" },
  leader: { fontSize: "0.85rem", color: "#6B7280", marginBottom: "0.5rem" },
  focus: { fontSize: "0.875rem", color: "#374151", marginBottom: "0.75rem", lineHeight: 1.5 },
  tags: { display: "flex", gap: "0.4rem", flexWrap: "wrap" },
  tag: { background: "#f3f4f6", color: "#374151", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem" },
  progressWrap: { marginTop: "0.75rem", marginBottom: "0.75rem" },
  progressTop: { display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", alignItems: "center" },
  progressLabel: { fontSize: "0.75rem", color: "#6B7280", fontWeight: 500 },
  progressPct: { fontSize: "0.8rem", fontWeight: 700, color: "#4F46E5" },
  progressBar: { height: "6px", background: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" },
  progressFill: { height: "100%", background: "#4F46E5", borderRadius: "9999px", transition: "width 0.4s ease" },
  progressNote: { fontSize: "0.75rem", color: "#9CA3AF", marginTop: "0.35rem", fontStyle: "italic", lineHeight: 1.4 },
};
