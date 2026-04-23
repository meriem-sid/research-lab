import { useState, useEffect } from "react";
import api from "../services/api";
import SearchableSelect from "../components/SearchableSelect";

const statusColors = { Active: "#059669", Planning: "#4F46E5", Completed: "#059669", "On Hold": "#D97706" };
const statusBg = { Active: "#ECFDF5", Planning: "#EEF2FF", Completed: "#ECFDF5", "On Hold": "#FFFBEB" };

const pubStatusColors = {
  approved: { color: "#059669", bg: "#ECFDF5", label: "Approved" },
  pending:  { color: "#D97706", bg: "#FFFBEB", label: "Pending" },
  rejected: { color: "#DC2626", bg: "#FEF2F2", label: "Rejected" },
};

export default function MyWork() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [taskError, setTaskError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  // Leader-only state
  const [myTeam, setMyTeam] = useState(null);
  const [teamPubs, setTeamPubs] = useState([]);

  let user;
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }
  const isLeader = user.role === "team_leader";
  const isMember = user.role === "member";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        let allProjects = [];

        if (isLeader) {
          // Leader: fetch their team, then team publications
          const { data: teamsData } = await api.get("/teams");
          const team = (teamsData.data || []).find(
            (t) => String(t.leaderId?._id || t.leaderId) === String(user.memberProfile)
          );
          setMyTeam(team || null);

          if (team) {
            // Fetch ALL publications for this team (including pending / rejected)
            try {
              const { data: pubsData } = await api.get(`/publications/team/${team._id}`);
              setTeamPubs(pubsData.data || []);
            } catch (pubErr) {
              console.error("Failed to fetch team publications:", pubErr);
              setTeamPubs([]);
            }

            allProjects = (team.activeProjects || []).map((p, idx) => ({
              ...p,
              team: team.teamName,
              teamId: team._id,
              tasks: (p.tasks || []).map((t, tIdx) => ({ ...t, _index: tIdx })),
              members: p.projectMembers || [],
              _projectIndex: idx,
            }));
          }
        } else if (user.role === "admin" || user.role === "head_of_lab") {
          const { data } = await api.get("/dashboard/head").catch(() => api.get("/dashboard/admin"));
          const deptData = data.data?.departments || [];
          allProjects = deptData.flatMap((dept) =>
            (dept.teams || []).flatMap((team) =>
              (team.activeProjects || []).map((p) => ({
                ...p,
                team: team.teamName || dept.name,
                teamId: team._id,
                tasks: (p.tasks || []).map((t, idx) => ({ ...t, _index: idx })),
                members: p.projectMembers || [],
                _projectIndex: (team.activeProjects || []).indexOf(p),
              }))
            )
          );
        } else if (isMember && user.memberProfile) {
          const memberId = typeof user.memberProfile === 'object'
            ? user.memberProfile._id
            : user.memberProfile;
          const { data } = await api.get(`/teams/member/${memberId}`);
          allProjects = (data.data || []).flatMap((team) =>
            (team.activeProjects || []).map((p, idx) => ({
              ...p,
              team: team.teamName,
              teamId: team._id,
              tasks: (p.tasks || []).map((t, tIdx) => ({ ...t, _index: tIdx })),
              members: p.projectMembers || [],
              _projectIndex: idx,
            }))
          );
        }

        setProjects(allProjects);
      } catch (err) {
        console.error("Failed to fetch work data:", err);
        setError("Failed to load your work. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLeader, isMember, user.role, user.memberProfile]);

  const showSaveMsg = (msg) => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const getProgress = (tasks) => {
    if (!tasks.length) return 0;
    return Math.round((tasks.filter((t) => t.submitted).length / tasks.length) * 100);
  };

  const isCompleted = (tasks) => tasks.length > 0 && tasks.every((t) => t.submitted);

  // ── Member actions ──────────────────────────────────────────────────────

  const submitTask = async (projectId, taskIndex, file) => {
    const proj = projects.find((p) => p._projectIndex === projectId && p.team === selected.team);
    if (!proj) return;

    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showSaveMsg(`File must be under ${maxSizeMB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await api.patch(`/teams/${proj.teamId}/projects/${projectId}/tasks/${taskIndex}`, {
          submitted: true,
          fileName: file.name,
          fileData: reader.result,
        });

        const updated = projects.map((p) =>
          p._projectIndex === projectId && p.team === selected.team
            ? {
                ...p,
                tasks: p.tasks.map((t, idx) =>
                  idx === taskIndex
                    ? { ...t, submitted: true, fileName: file.name, fileData: reader.result }
                    : t
                ),
              }
            : p
        );
        setProjects(updated);
        setSelected(updated.find((p) => p._projectIndex === projectId && p.team === selected.team));
        showSaveMsg("Task submitted successfully");
      } catch (err) {
        console.error("Failed to update task:", err);
        showSaveMsg("Failed to submit task. Please try again.");
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteSubmission = async (projectId, taskIndex) => {
    const proj = projects.find((p) => p._projectIndex === projectId && p.team === selected.team);
    if (!proj) return;

    try {
      await api.patch(`/teams/${proj.teamId}/projects/${projectId}/tasks/${taskIndex}`, {
        submitted: false,
        fileName: "",
        fileData: "",
      });

      const updated = projects.map((p) =>
        p._projectIndex === projectId && p.team === selected.team
          ? {
              ...p,
              tasks: p.tasks.map((t, idx) =>
                idx === taskIndex
                  ? { ...t, submitted: false, fileName: "", fileData: "" }
                  : t
              ),
            }
          : p
      );
      setProjects(updated);
      setSelected(updated.find((p) => p._projectIndex === projectId && p.team === selected.team));
      showSaveMsg("Submission deleted");
    } catch (err) {
      console.error("Failed to delete submission:", err);
      showSaveMsg("Failed to delete submission. Please try again.");
    }
  };

  // ── Leader actions ──────────────────────────────────────────────────────

  const addProjectMember = async (memberId) => {
    const proj = projects.find((p) => p._projectIndex === selected._projectIndex && p.team === selected.team);
    if (!proj) return;
    try {
      await api.post(`/teams/${proj.teamId}/projects/${proj._projectIndex}/members`, { memberId });
      const updated = projects.map((p) =>
        p._projectIndex === selected._projectIndex && p.team === selected.team
          ? { ...p, members: [...p.members, memberId] }
          : p
      );
      setProjects(updated);
      setSelected(updated.find((p) => p._projectIndex === selected._projectIndex && p.team === selected.team));
      showSaveMsg("Member added to project");
    } catch (err) {
      console.error("Failed to add member:", err);
      showSaveMsg(err.response?.data?.message || "Failed to add member");
    }
  };

  const removeProjectMember = async (memberId) => {
    const proj = projects.find((p) => p._projectIndex === selected._projectIndex && p.team === selected.team);
    if (!proj) return;
    try {
      await api.delete(`/teams/${proj.teamId}/projects/${proj._projectIndex}/members/${memberId}`);
      const updated = projects.map((p) =>
        p._projectIndex === selected._projectIndex && p.team === selected.team
          ? { ...p, members: p.members.filter((m) => String(m) !== String(memberId)) }
          : p
      );
      setProjects(updated);
      setSelected(updated.find((p) => p._projectIndex === selected._projectIndex && p.team === selected.team));
      showSaveMsg("Member removed from project");
    } catch (err) {
      console.error("Failed to remove member:", err);
      showSaveMsg(err.response?.data?.message || "Failed to remove member");
    }
  };

  const addTask = async () => {
    if (!newTaskDesc.trim()) {
      setTaskError("Task description is required.");
      return;
    }
    setTaskError("");
    const proj = projects.find((p) => p._projectIndex === selected._projectIndex && p.team === selected.team);
    if (!proj) return;

    try {
      const { data } = await api.post(`/teams/${proj.teamId}/projects/${proj._projectIndex}/tasks`, {
        description: newTaskDesc.trim(),
      });
      const newTask = data.data;
      const updated = projects.map((p) =>
        p._projectIndex === selected._projectIndex && p.team === selected.team
          ? {
              ...p,
              tasks: [
                ...p.tasks,
                { ...newTask, _index: p.tasks.length },
              ],
            }
          : p
      );
      setProjects(updated);
      setSelected(updated.find((p) => p._projectIndex === selected._projectIndex && p.team === selected.team));
      setNewTaskDesc("");
      showSaveMsg("Task added");
    } catch (err) {
      console.error("Failed to add task:", err);
      showSaveMsg(err.response?.data?.message || "Failed to add task");
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <main style={s.page}>
        <div style={s.header}>
          <h1 style={s.title}>My Work</h1>
          <p style={s.sub}>Loading your projects...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={s.page}>
        <div style={s.header}>
          <h1 style={s.title}>My Work</h1>
          <p style={{ color: "#DC2626" }}>{error}</p>
          <button style={s.retryBtn} onClick={() => window.location.reload()}>Retry</button>
        </div>
      </main>
    );
  }

  // ── Leader Dashboard (read-only) ──────────────────────────────────────
  const renderLeaderDashboard = () => {
    if (!myTeam) return null;
    return (
      <div style={s.dashboard}>
        <h2 style={s.dashboardTitle}>Team Dashboard</h2>
        <div style={s.dashboardGrid}>
          <div style={s.dashboardCard}>
            <h3 style={s.dashboardCardTitle}>Team Members</h3>
            {(myTeam.teamMembers || []).length === 0 ? (
              <p style={s.dashboardEmpty}>No members in this team.</p>
            ) : (
              <div style={s.memberList}>
                {(myTeam.teamMembers || []).map((m) => (
                  <div key={m._id} style={s.memberRow}>
                    <span style={s.memberName}>{m.fullName}</span>
                    <span style={s.memberRole}>{m.academicRole}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={s.dashboardCard}>
            <h3 style={s.dashboardCardTitle}>Publications ({teamPubs.length})</h3>
            {teamPubs.length === 0 ? (
              <p style={s.dashboardEmpty}>No publications submitted yet.</p>
            ) : (
              <div style={s.pubList}>
                {teamPubs.map((pub) => {
                  const st = pubStatusColors[pub.approvalStatus] || pubStatusColors.pending;
                  return (
                    <div key={pub._id} style={s.pubRow}>
                      <div style={s.pubInfo}>
                        <span style={s.pubTitle}>{pub.title}</span>
                        <span style={{ ...s.pubStatusBadge, color: st.color, background: st.bg }}>{st.label}</span>
                      </div>
                      <span style={s.pubYear}>{pub.year}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Project detail: Leader split view ───────────────────────────────────
  const renderLeaderProjectDetail = (proj) => {
    const progress = getProgress(proj.tasks);
    const completed = isCompleted(proj.tasks);

    const assignedIds = new Set((proj.members || []).map(String));
    const assignedMembers = (myTeam?.teamMembers || []).filter((m) => assignedIds.has(String(m._id)));
    const availableMembers = (myTeam?.teamMembers || []).filter((m) => !assignedIds.has(String(m._id)));

    return (
      <main style={s.page}>
        {saveMsg && <div style={s.saveToast}>{saveMsg}</div>}
        <button style={s.back} onClick={() => setSelected(null)}>← Back to My Work</button>

        <div style={s.projHeader}>
          <div style={s.projHeaderTop}>
            <h1 style={s.projTitle}>{proj.title}</h1>
            <span style={{ ...s.statusPill, color: completed ? statusColors.Completed : statusColors.Active, background: completed ? statusBg.Completed : statusBg.Active }}>
              {completed ? "Completed" : "In Progress"}
            </span>
          </div>
          <p style={s.projDesc}>{proj.description}</p>
          <p style={s.projMeta}>{proj.team} · {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : "N/A"}</p>
        </div>

        <div style={s.progressSection}>
          <div style={s.progressTop}>
            <span style={s.progressLabel}>Overall Progress</span>
            <span style={s.progressPct}>{progress}%</span>
          </div>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width: `${progress}%`, background: completed ? "#059669" : "#4F46E5" }} />
          </div>
          <p style={s.progressNote}>
            {proj.tasks.filter((t) => t.submitted).length} of {proj.tasks.length} tasks submitted
          </p>
        </div>

        <div style={s.splitView}>
          {/* LEFT — Project Members */}
          <div style={s.leftColumn}>
            <h2 style={s.sectionTitle}>Project Members</h2>
            {assignedMembers.length === 0 && <p style={s.emptyTasks}>No members assigned yet.</p>}
            {assignedMembers.map((m) => (
              <div key={m._id} style={s.memberCard}>
                <div>
                  <p style={s.memberCardName}>{m.fullName}</p>
                  <p style={s.memberCardMeta}>{m.academicRole} · {m.email}</p>
                </div>
                <button style={s.removeMemberBtn} onClick={() => removeProjectMember(m._id)}>Remove</button>
              </div>
            ))}

            {availableMembers.length > 0 && (
              <div style={s.addMemberBox}>
                <h4 style={s.addMemberTitle}>Add Member</h4>
                <SearchableSelect
                  options={availableMembers.map((m) => ({ value: m._id, label: `${m.fullName} (${m.academicRole})` }))}
                  value=""
                  onChange={(val) => {
                    if (val) addProjectMember(val);
                  }}
                  placeholder="Select a team member..."
                />
              </div>
            )}
          </div>

          {/* RIGHT — Tasks */}
          <div style={s.rightColumn}>
            <h2 style={s.sectionTitle}>Tasks</h2>
            {proj.tasks.length === 0 && <p style={s.emptyTasks}>No tasks yet. Add one below.</p>}
            {proj.tasks.map((task, idx) => (
              <div key={idx} style={{ ...s.taskCard, borderLeft: `4px solid ${task.submitted ? "#059669" : "#4F46E5"}` }}>
                <div style={s.taskTop}>
                  <p style={s.taskDesc}>{task.description}</p>
                  <span style={{ ...s.taskStatus, color: task.submitted ? "#059669" : "#6B7280", background: task.submitted ? "#ECFDF5" : "#F3F4F6" }}>
                    {task.submitted ? "Submitted" : "Pending"}
                  </span>
                </div>
                {task.submitted && task.fileName && (
                  <div style={s.fileRow}>
                    <a href={task.fileData} download={task.fileName} style={s.reviewBtn}>{task.fileName}</a>
                  </div>
                )}
              </div>
            ))}

            <div style={s.addTaskBox}>
              <h3 style={s.addTaskTitle}>Add New Task</h3>
              <div style={s.addTaskRow}>
                <input
                  style={s.addTaskInput}
                  placeholder="Task description..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                />
                <button style={s.addTaskBtn} onClick={addTask}>Add Task</button>
              </div>
              {taskError && <p style={s.taskError}>{taskError}</p>}
            </div>
          </div>
        </div>
      </main>
    );
  };

  // ── Project detail: Member task submission view ──────────────────────────
  const renderMemberProjectDetail = (proj) => {
    const progress = getProgress(proj.tasks);
    const completed = isCompleted(proj.tasks);

    return (
      <main style={s.page}>
        {saveMsg && <div style={s.saveToast}>{saveMsg}</div>}
        <button style={s.back} onClick={() => setSelected(null)}>← Back to My Work</button>

        <div style={s.projHeader}>
          <div style={s.projHeaderTop}>
            <h1 style={s.projTitle}>{proj.title}</h1>
            <span style={{ ...s.statusPill, color: completed ? statusColors.Completed : statusColors.Active, background: completed ? statusBg.Completed : statusBg.Active }}>
              {completed ? "Completed" : "In Progress"}
            </span>
          </div>
          <p style={s.projDesc}>{proj.description}</p>
          <p style={s.projMeta}>{proj.team} · {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : "N/A"}</p>
        </div>

        <div style={s.progressSection}>
          <div style={s.progressTop}>
            <span style={s.progressLabel}>Overall Progress</span>
            <span style={s.progressPct}>{progress}%</span>
          </div>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width: `${progress}%`, background: completed ? "#059669" : "#4F46E5" }} />
          </div>
          <p style={s.progressNote}>
            {proj.tasks.filter((t) => t.submitted).length} of {proj.tasks.length} tasks submitted
          </p>
        </div>

        {/* Project Overview — full-width card */}
        <div style={s.overviewCardFull}>
          <h2 style={s.cardTitle}>Project Overview</h2>
          <div style={s.overviewGrid}>
            <div style={s.overviewItem}>
              <p style={s.overviewLabel}>Team</p>
              <p style={s.overviewValue}>{proj.team}</p>
            </div>
            <div style={s.overviewItem}>
              <p style={s.overviewLabel}>Start Date</p>
              <p style={s.overviewValue}>{proj.startDate ? new Date(proj.startDate).toLocaleDateString() : "N/A"}</p>
            </div>
            <div style={s.overviewItem}>
              <p style={s.overviewLabel}>Status</p>
              <p style={s.overviewValue}>{completed ? "Completed" : "In Progress"}</p>
            </div>
            <div style={s.overviewItem}>
              <p style={s.overviewLabel}>Tasks</p>
              <p style={s.overviewValue}>{proj.tasks.length} total · {proj.tasks.filter((t) => t.submitted).length} submitted</p>
            </div>
          </div>
        </div>

        {/* Tasks — full-width card */}
        <div style={s.tasksCard}>
          <h2 style={s.cardTitle}>Your Tasks</h2>
          {proj.tasks.length === 0 && <p style={s.emptyTasks}>No tasks assigned yet.</p>}
          {proj.tasks.map((task, idx) => (
            <div key={idx} style={{ ...s.memberTaskCard, borderLeft: `4px solid ${task.submitted ? "#059669" : "#4F46E5"}` }}>
              <div style={s.taskTop}>
                <p style={s.taskDesc}>{task.description}</p>
                <span style={{ ...s.taskStatus, color: task.submitted ? "#059669" : "#6B7280", background: task.submitted ? "#ECFDF5" : "#F3F4F6" }}>
                  {task.submitted ? "Submitted" : "Pending"}
                </span>
              </div>

              {task.submitted && task.fileName ? (
                <div style={s.fileRow}>
                  <a href={task.fileData} download={task.fileName} style={s.reviewBtn}>
                    {task.fileName}
                  </a>
                  <button style={s.deleteBtn} onClick={() => deleteSubmission(proj._projectIndex, idx)}>Delete</button>
                </div>
              ) : (
                <label style={s.submitLabel}>
                  <input type="file" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) submitTask(proj._projectIndex, idx, e.target.files[0]); }} />
                  <span style={s.submitWorkBtn}>Submit Work</span>
                </label>
              )}
            </div>
          ))}
        </div>
      </main>
    );
  };

  // ── Selected project rendering ──────────────────────────────────────────
  if (selected) {
    const proj = projects.find((p) => p._projectIndex === selected._projectIndex && p.team === selected.team);
    if (!proj) {
      setSelected(null);
      return null;
    }
    if (isLeader) return renderLeaderProjectDetail(proj);
    return renderMemberProjectDetail(proj);
  }

  // ── Project list view ───────────────────────────────────────────────────
  return (
    <main style={s.page}>
      {saveMsg && <div style={s.saveToast}>{saveMsg}</div>}
      <div style={s.header}>
        <h1 style={s.title}>My Work</h1>
        <p style={s.sub}>Your assigned projects and tasks</p>
      </div>

      {isLeader && renderLeaderDashboard()}

      {projects.length === 0 ? (
        <div style={s.emptyState}>
          <p style={s.emptyText}>No projects assigned to you yet.</p>
        </div>
      ) : (
        <div style={s.projectGrid}>
          {projects.map((proj) => {
            const progress = getProgress(proj.tasks);
            const completed = isCompleted(proj.tasks);
            return (
              <div key={`${proj.team}-${proj._projectIndex}`} style={s.projectCard} onClick={() => setSelected(proj)}>
                <div style={s.projectCardHeader}>
                  <h2 style={s.projectCardTitle}>{proj.title}</h2>
                  <span style={{ ...s.statusPill, color: completed ? statusColors.Completed : statusColors.Active, background: completed ? statusBg.Completed : statusBg.Active }}>
                    {completed ? "Completed" : "In Progress"}
                  </span>
                </div>
                <p style={s.projectCardDesc}>{proj.description || "No description"}</p>
                <p style={s.projectCardMeta}>{proj.team} · {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : "N/A"}</p>
                <div style={s.cardProgressArea}>
                  <div style={s.progressTop}>
                    <span style={s.progressLabel}>Progress</span>
                    <span style={{ ...s.progressPct, color: completed ? "#059669" : "#4F46E5" }}>{progress}%</span>
                  </div>
                  <div style={s.progressTrack}>
                    <div style={{ ...s.progressFill, width: `${progress}%`, background: completed ? "#059669" : "#4F46E5" }} />
                  </div>
                  <p style={s.progressMeta}>{proj.tasks.filter((t) => t.submitted).length}/{proj.tasks.length} tasks</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

const s = {
  page: { maxWidth: "1400px", margin: "0 auto", padding: "3rem 2.5rem" },
  header: { textAlign: "center", marginBottom: "2.5rem" },
  title: { fontSize: "2rem", fontWeight: 700, color: "#111827" },
  sub: { color: "#6B7280", marginTop: "0.5rem" },
  back: { background: "none", border: "none", color: "#4F46E5", cursor: "pointer", fontSize: "0.9rem", marginBottom: "2rem", padding: 0, display: "block" },
  emptyState: { textAlign: "center", padding: "4rem 0" },
  emptyText: { color: "#9CA3AF", fontSize: "1rem" },
  projectList: { display: "flex", flexDirection: "column", gap: "1rem" },
  projectCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.5rem", cursor: "pointer", transition: "box-shadow 0.2s", borderLeft: "4px solid #4F46E5" },
  projectCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" },
  projectCardTitle: { fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" },
  projectCardDesc: { fontSize: "0.875rem", color: "#6B7280", marginBottom: "0.25rem" },
  projectCardMeta: { fontSize: "0.8rem", color: "#9CA3AF" },
  statusPill: { padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, flexShrink: 0 },
  cardProgressArea: { marginTop: "0.5rem" },
  projHeader: { marginBottom: "1.5rem" },
  projHeaderTop: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" },
  projTitle: { fontSize: "1.75rem", fontWeight: 800, color: "#111827" },
  projDesc: { color: "#6B7280", marginBottom: "0.25rem" },
  projMeta: { fontSize: "0.8rem", color: "#9CA3AF" },
  progressSection: { background: "#EEF2FF", borderRadius: "0.75rem", padding: "1.25rem 1.5rem", marginBottom: "2rem" },
  progressTop: { display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" },
  progressLabel: { fontSize: "0.875rem", color: "#6B7280", fontWeight: 500 },
  progressPct: { fontSize: "0.875rem", fontWeight: 700, color: "#4F46E5" },
  progressTrack: { height: "10px", background: "#C7D2FE", borderRadius: "9999px", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: "9999px", transition: "width 0.4s ease" },
  progressNote: { fontSize: "0.78rem", color: "#6B7280", marginTop: "0.5rem" },
  overviewCardFull: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "1.5rem" },
  cardTitle: { fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" },
  overviewGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" },
  overviewItem: { background: "#f9fafb", borderRadius: "0.5rem", padding: "0.75rem 1rem" },
  overviewLabel: { fontSize: "0.75rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.15rem" },
  overviewValue: { fontSize: "0.9rem", fontWeight: 600, color: "#111827" },
  tasksCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.5rem" },
  memberTaskCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "0.75rem", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" },
  sectionTitle: { fontSize: "1.2rem", fontWeight: 700, color: "#111827", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #EEF2FF" },
  emptyTasks: { color: "#9CA3AF", fontSize: "0.875rem", marginBottom: "1rem" },
  taskCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "0.75rem" },
  taskTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", gap: "1rem" },
  taskDesc: { fontSize: "0.9rem", color: "#111827", fontWeight: 500, flex: 1, lineHeight: 1.5 },
  taskStatus: { fontSize: "0.72rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", flexShrink: 0 },
  fileRow: { display: "flex", alignItems: "center", gap: "0.75rem" },
  reviewBtn: { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 1rem", background: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE", borderRadius: "0.375rem", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", cursor: "pointer" },
  deleteBtn: { padding: "0.4rem 0.9rem", background: "#F3F4F6", color: "#6B7280", border: "1px solid #e5e7eb", borderRadius: "0.375rem", fontSize: "0.8rem", cursor: "pointer", fontWeight: 500 },
  submitLabel: { cursor: "pointer", display: "inline-block" },
  submitWorkBtn: { display: "inline-block", padding: "0.4rem 1.1rem", background: "#4F46E5", color: "#fff", borderRadius: "0.375rem", fontSize: "0.82rem", fontWeight: 600 },
  addTaskBox: { background: "#f9fafb", border: "1px dashed #C7D2FE", borderRadius: "0.75rem", padding: "1.25rem", marginTop: "1rem" },
  addTaskTitle: { fontSize: "0.9rem", fontWeight: 600, color: "#374151", marginBottom: "0.75rem" },
  addTaskRow: { display: "flex", gap: "0.75rem" },
  addTaskInput: { flex: 1, padding: "0.55rem 0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem", fontSize: "0.875rem" },
  addTaskBtn: { padding: "0.55rem 1.25rem", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "0.375rem", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" },
  taskError: { color: "#DC2626", fontSize: "0.8rem", marginTop: "0.4rem" },
  retryBtn: { padding: "0.5rem 1rem", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontWeight: 500, marginTop: "1rem" },
  saveToast: { position: "fixed", top: "80px", right: "2rem", background: "#111827", color: "#fff", padding: "0.6rem 1rem", borderRadius: "0.5rem", zIndex: 9999, fontSize: "0.875rem" },

  // Leader dashboard styles
  dashboard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "2rem" },
  dashboardTitle: { fontSize: "1.2rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" },
  dashboardGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  dashboardCard: { background: "#f9fafb", borderRadius: "0.5rem", padding: "1rem" },
  dashboardCardTitle: { fontSize: "0.9rem", fontWeight: 600, color: "#374151", marginBottom: "0.75rem" },
  dashboardEmpty: { color: "#9CA3AF", fontSize: "0.8rem" },
  memberList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  memberRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid #f3f4f6" },
  memberName: { fontSize: "0.85rem", fontWeight: 500, color: "#111827" },
  memberRole: { fontSize: "0.75rem", color: "#6B7280", background: "#EEF2FF", padding: "0.15rem 0.4rem", borderRadius: "0.25rem" },
  pubList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  pubRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid #f3f4f6" },
  pubTitle: { fontSize: "0.85rem", fontWeight: 500, color: "#111827", flex: 1, marginRight: "0.5rem" },
  pubYear: { fontSize: "0.75rem", color: "#6B7280", flexShrink: 0 },
  pubInfo: { display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 },
  pubStatusBadge: { fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "9999px", flexShrink: 0 },

  // Leader split view styles
  splitView: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  leftColumn: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.25rem" },
  rightColumn: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.25rem" },
  memberCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "#f9fafb", borderRadius: "0.5rem", marginBottom: "0.5rem" },
  memberCardName: { fontSize: "0.85rem", fontWeight: 600, color: "#111827" },
  memberCardMeta: { fontSize: "0.75rem", color: "#6B7280" },
  removeMemberBtn: { padding: "0.3rem 0.6rem", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: "0.375rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: 500 },
  addMemberBox: { marginTop: "1rem", padding: "0.75rem", background: "#EEF2FF", borderRadius: "0.5rem" },
  addMemberTitle: { fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" },
};
