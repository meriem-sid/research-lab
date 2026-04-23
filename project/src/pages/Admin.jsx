import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import SearchableSelect from "../components/SearchableSelect";


const ANN_TYPES = ["Event", "Award", "Seminar", "Announcement", "Publication", "General"];

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [regs, setRegs] = useState([]);
  const [pendingPubs, setPendingPubs] = useState([]);
  const [rejectReason, setRejectReason] = useState({});
  const [rejectOpen, setRejectOpen] = useState({});
  const [toast, setToast] = useState("");
  const [degreeModal, setDegreeModal] = useState(null);
  const [approveRole, setApproveRole] = useState("member");
  const [memberActive, setMemberActive] = useState([]);
  const [adminMembers, setAdminMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teamForm, setTeamForm] = useState({ teamName: "", leaderId: "", researchFocus: "", department: "", teamMembers: [], projects: [{ title: "", status: "Planning" }] });
  const [availableMembers, setAvailableMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [annForm, setAnnForm] = useState({ title: "", type: "Announcement", date: "", shortDesc: "", author: "", fullDesc: "", image: null, imagePreview: "" });
  const [annError, setAnnError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalMembers: 0, totalTeams: 0, totalDepartments: 0, totalPublications: 0 });

  useEffect(() => {
    let user;
    try {
      user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      user = {};
    }
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }
    
    // Fetch pending registrations from backend
    const fetchPendingRegs = async () => {
      try {
        const { data } = await api.get("/auth/pending");
        setRegs(data.data || []);
      } catch (err) {
        console.error("Failed to fetch pending registrations:", err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          navigate("/login");
          return;
        }
        setRegs([]);
      }
    };

    // Fetch pending publications from backend
    const fetchPendingPubs = async () => {
      try {
        const { data } = await api.get("/publications/pending");
        setPendingPubs(data.data || []);
      } catch (err) {
        console.error("Failed to fetch pending publications:", err);
        setPendingPubs([]);
      }
    };

    // Fetch announcements (news) from backend
    const fetchNews = async () => {
      try {
        const { data } = await api.get("/news");
        setAnnouncements(data.data || []);
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
        setAnnouncements([]);
      }
    };

    // Fetch departments for create-team dropdown
    const fetchDepartments = async () => {
      try {
        const { data } = await api.get("/departments");
        setDepartments(data.data || []);
      } catch (err) {
        console.error("Failed to fetch departments:", err);
      }
    };

    // Fetch members for leader / team member selection
    const fetchMembers = async () => {
      try {
        const { data } = await api.get("/members");
        setAvailableMembers(data.data || []);
      } catch (err) {
        console.error("Failed to fetch members:", err);
      }
    };

    // Fetch admin members list
    const fetchAdminMembers = async () => {
      try {
        const { data } = await api.get("/dashboard/admin/members");
        const members = data.data || [];
        setAdminMembers(members);
        setMemberActive(members.map((m) => ({ id: m._id, active: m.user?.isActive !== false })));
      } catch (err) {
        console.error("Failed to fetch admin members:", err);
      }
    };

    // Fetch public stats
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/stats");
        setStats((prev) => data.data ?? prev);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    fetchPendingRegs();
    fetchPendingPubs();
    fetchNews();
    fetchDepartments();
    fetchMembers();
    fetchAdminMembers();
    fetchStats();
  }, [navigate]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const approveReg = async (id) => {
    console.log("[Admin] Approving registration:", id);
    try {
      setLoading(true);
      const res = await api.put(`/auth/approve/${id}`, { role: approveRole });
      console.log("[Admin] Approve registration response:", res.data);
      const updated = regs.filter((r) => r._id !== id);
      setRegs(updated);
      showToast("Registration approved");
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error("[Admin] Failed to approve registration:", err.response?.status, msg);
      showToast(`Failed to approve: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const rejectReg = async (id) => {
    console.log("[Admin] Rejecting registration:", id);
    try {
      setLoading(true);
      const reason = rejectReason[`reg-${id}`] || "";
      const res = await api.put(`/auth/reject/${id}`, { rejectionReason: reason });
      console.log("[Admin] Reject registration response:", res.data);
      const updated = regs.filter((r) => r._id !== id);
      setRegs(updated);
      setRejectOpen({});
      showToast("Registration rejected");
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error("[Admin] Failed to reject registration:", err.response?.status, msg);
      showToast(`Failed to reject: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const approvePub = async (id) => {
    console.log("[Admin] Approving publication:", id);
    try {
      setLoading(true);
      const res = await api.put(`/publications/${id}/approve`);
      console.log("[Admin] Approve publication response:", res.data);
      const updated = pendingPubs.filter((p) => p._id !== id);
      setPendingPubs(updated);
      showToast("Publication approved");
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error("[Admin] Failed to approve publication:", err.response?.status, msg);
      showToast(`Failed to approve: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const rejectPub = async (id) => {
    console.log("[Admin] Rejecting publication:", id);
    try {
      setLoading(true);
      const reason = rejectReason[`pub-${id}`] || "";
      const res = await api.put(`/publications/${id}/reject`, { reason });
      console.log("[Admin] Reject publication response:", res.data);
      const updated = pendingPubs.filter((p) => p._id !== id);
      setPendingPubs(updated);
      setRejectOpen({});
      showToast("Publication rejected");
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error("[Admin] Failed to reject publication:", err.response?.status, msg);
      showToast(`Failed to reject: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnnImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setAnnError(`Image must be under ${maxSizeMB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }
    setAnnError("");
    const reader = new FileReader();
    reader.onload = () => setAnnForm((f) => ({ ...f, image: reader.result, imagePreview: reader.result }));
    reader.readAsDataURL(file);
  };

  const submitAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.date || !annForm.shortDesc.trim() || !annForm.author.trim() || !annForm.fullDesc.trim()) {
      setAnnError("Please fill in all required fields.");
      return;
    }
    setAnnError("");
    setLoading(true);
    try {
      const payload = {
        headline: annForm.title,
        category: annForm.type,
        date: annForm.date,
        summary: annForm.shortDesc,
        author: annForm.author,
        fullStory: annForm.fullDesc,
        image: annForm.image || `https://picsum.photos/seed/ann${Date.now()}/600/300`,
        isPublished: true,
      };
      const { data } = await api.post("/news", payload);
      setAnnouncements((prev) => [data.data, ...prev]);
      setAnnForm({ title: "", type: "Announcement", date: "", shortDesc: "", author: "", fullDesc: "", image: null, imagePreview: "" });
      showToast("Announcement posted");
    } catch (err) {
      showToast("Failed to post announcement");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = ["overview", "publications-overview", "create-team", "create-announcement", "manage-members"];

  return (
    <div style={s.layout}>
      <aside style={s.sidebar}>
        <h2 style={s.sideTitle}>Admin Panel</h2>
        {tabs.map((t) => (
          <button key={t} style={{ ...s.sideBtn, ...(tab === t ? s.sideBtnActive : {}) }} onClick={() => setTab(t)}>
            {t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </aside>

      <main style={s.content}>
        {loading && <div style={s.loadingBar}>Processing...</div>}
        {toast && <div style={s.toast}>{toast}</div>}

        {tab === "overview" && (
          <div>
            <h1 style={s.pageTitle}>Dashboard Overview</h1>
            <div style={s.statsGrid}>
              {[ ["Members", stats.totalMembers, "#4F46E5"], ["Teams", stats.totalTeams, "#059669"], ["Departments", stats.totalDepartments, "#0891B2"], ["Approved Pubs", stats.totalPublications, "#059669"], ["Pending Pubs", pendingPubs.length, "#D97706"], ["Pending Reg.", regs.length, "#D97706"] ].map(([label, val, color]) => (
                <div key={label} style={s.statCard}>
                  <div style={{ ...s.statVal, color }}>{val}</div>
                  <div style={s.statLabel}>{label}</div>
                </div>
              ))}
            </div>

            <h2 style={s.sectionTitle}>Pending Registrations</h2>
            {regs.length === 0 ? <p style={s.empty}>No pending registrations.</p> : regs.map((r) => (
              <div key={r._id} style={s.queueRow}>
                <div>
                  <div style={s.qName}>{r.name}</div>
                  <div style={s.qMeta}>{r.email} · {r.createdAt}{r._registrationMeta?.academicRole ? ` · ${r._registrationMeta.academicRole}` : ""}</div>
                </div>
                <div style={s.qActions}>
                  {r._registrationMeta?.degree?.data && (
                    <button style={s.degreeBtn} onClick={() => setDegreeModal(r._registrationMeta.degree)}>View Degree</button>
                  )}
                  <select
                    value={approveRole}
                    onChange={(e) => setApproveRole(e.target.value)}
                    style={{ padding: "8px", marginRight: "8px", borderRadius: "0.375rem", border: "1px solid #e5e7eb", fontSize: "0.8rem" }}
                  >
                    <option value="member">Member</option>
                    <option value="team_leader">Team Leader</option>
                  </select>
                  <button style={s.approveBtn} onClick={() => approveReg(r._id)}>Approve</button>
                  <button style={s.rejectBtn} onClick={() => setRejectOpen({ ...rejectOpen, [`reg-${r._id}`]: true })}>Reject</button>
                </div>
                {rejectOpen[`reg-${r._id}`] && (
                  <div style={s.rejectBox}>
                    <input style={s.rejectInput} placeholder="Reason for rejection..." value={rejectReason[`reg-${r._id}`] || ""} onChange={(e) => setRejectReason({ ...rejectReason, [`reg-${r._id}`]: e.target.value })} />
                    <button style={s.rejectConfirm} onClick={() => rejectReg(r._id)}>Confirm Reject</button>
                  </div>
                )}
              </div>
            ))}

            {degreeModal && (
              <div style={s.overlay} onClick={() => setDegreeModal(null)}>
                <div style={s.degreeModalBox} onClick={(e) => e.stopPropagation()}>
                  <div style={s.degreeModalHeader}>
                    <h3 style={s.degreeModalTitle}>{degreeModal.name}</h3>
                    <button style={s.closeBtn} onClick={() => setDegreeModal(null)}>×</button>
                  </div>
                  <iframe src={degreeModal.data} style={s.pdfFrame} title="Degree PDF" />
                  <a href={degreeModal.data} download={degreeModal.name} style={s.downloadBtn}>Download PDF</a>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "publications-overview" && (
          <div>
            <h1 style={s.pageTitle}>Publications Overview</h1>
            <p style={s.pageSubtitle}>Review and approve publications submitted by team leaders and members.</p>
            {pendingPubs.length === 0 ? (
              <div style={s.emptyBox}>
                <p style={s.empty}>No pending publications to review.</p>
              </div>
            ) : (
              pendingPubs.map((p) => (
                <div key={p._id} style={s.pubReviewCard}>
                  <div style={s.pubReviewTop}>
                    <div style={s.pubReviewInfo}>
                      <span style={s.pubTypeBadge}>{p.type}</span>
                      <h3 style={s.pubReviewTitle}>{p.title}</h3>
                      <p style={s.pubReviewMeta}>{p.authors?.join(", ")} · {p.year}</p>
                      <p style={s.pubReviewMeta}>{p.publisher}{p.team ? ` · ${p.team}` : ""}</p>
                      {p.pdfLink && <a href={p.pdfLink} target="_blank" rel="noreferrer" style={s.pubPdfLink}>View PDF →</a>}
                    </div>
                    <div style={s.qActions}>
                      <button style={s.approveBtn} onClick={() => approvePub(p._id)}>Approve</button>
                      <button style={s.rejectBtn} onClick={() => setRejectOpen({ ...rejectOpen, [`pub-${p._id}`]: true })}>Reject</button>
                    </div>
                  </div>
                  {rejectOpen[`pub-${p._id}`] && (
                    <div style={s.rejectBox}>
                      <input style={s.rejectInput} placeholder="Reason for rejection..." value={rejectReason[`pub-${p._id}`] || ""} onChange={(e) => setRejectReason({ ...rejectReason, [`pub-${p._id}`]: e.target.value })} />
                      <button style={s.rejectConfirm} onClick={() => rejectPub(p._id)}>Confirm Reject</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "create-team" && (
          <div>
            <h1 style={s.pageTitle}>Create New Team</h1>
            <div style={s.form}>
              <div style={s.group}>
                <label style={s.label}>Team Name</label>
                <input style={s.input} type="text" value={teamForm.teamName} onChange={(e) => setTeamForm({ ...teamForm, teamName: e.target.value })} />
              </div>
              <div style={s.group}>
                <label style={s.label}>Leader <span style={s.req}>*</span></label>
                <SearchableSelect
                  options={availableMembers.map((m) => ({ value: m._id, label: `${m.fullName} (${m.email})` }))}
                  value={teamForm.leaderId}
                  onChange={(val) => {
                    const leader = availableMembers.find((m) => m._id === val);
                    setTeamForm({
                      ...teamForm,
                      leaderId: val,
                      leaderName: leader ? leader.fullName : "",
                    });
                  }}
                  placeholder="Search and select a leader..."
                />
              </div>
              <div style={s.group}>
                <label style={s.label}>Research Focus</label>
                <input style={s.input} type="text" value={teamForm.researchFocus} onChange={(e) => setTeamForm({ ...teamForm, researchFocus: e.target.value })} />
              </div>
              <div style={s.group}>
                <label style={s.label}>Department <span style={s.req}>*</span></label>
                <select style={s.input} value={teamForm.department} onChange={(e) => setTeamForm({ ...teamForm, department: e.target.value })}>
                  <option value="">Select a department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
              <div style={s.group}>
                <label style={s.label}>Members</label>
                <SearchableSelect
                  multiple
                  options={availableMembers.map((m) => ({ value: m._id, label: `${m.fullName} (${m.email})` }))}
                  value={teamForm.teamMembers}
                  onChange={(vals) => setTeamForm({ ...teamForm, teamMembers: vals })}
                  placeholder="Search and select members..."
                />
              </div>
              <div style={s.group}>
                <label style={s.label}>Active Projects</label>
                {teamForm.projects.map((p, i) => (
                  <div key={i} style={s.projectRow}>
                    <input style={{ ...s.input, flex: 2 }} placeholder="Project title" value={p.title} onChange={(e) => { const projs = [...teamForm.projects]; projs[i].title = e.target.value; setTeamForm({ ...teamForm, projects: projs }); }} />
                    <select style={{ ...s.input, flex: 1 }} value={p.status} onChange={(e) => { const projs = [...teamForm.projects]; projs[i].status = e.target.value; setTeamForm({ ...teamForm, projects: projs }); }}>
                      {["Planning", "Active", "Completed", "On Hold"].map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <button style={s.removeBtn} onClick={() => setTeamForm({ ...teamForm, projects: teamForm.projects.filter((_, j) => j !== i) })}>✕</button>
                  </div>
                ))}
                <button style={s.addBtn} onClick={() => setTeamForm({ ...teamForm, projects: [...teamForm.projects, { title: "", status: "Planning" }] })}>+ Add Project</button>
              </div>
              <button style={s.submitBtn} onClick={async () => {
                if (!teamForm.teamName.trim() || !teamForm.leaderId || !teamForm.researchFocus.trim() || !teamForm.department) {
                  showToast("Please fill in all required fields including a leader and department");
                  return;
                }
                setLoading(true);
                try {
                  const payload = {
                    teamName: teamForm.teamName,
                    leaderName: teamForm.leaderName || availableMembers.find(m => m._id === teamForm.leaderId)?.fullName || "",
                    leaderId: teamForm.leaderId,
                    researchFocus: teamForm.researchFocus,
                    department: teamForm.department,
                    teamMembers: teamForm.teamMembers || [],
                    activeProjects: teamForm.projects.filter((p) => p.title.trim()).map((p) => ({ title: p.title, status: p.status, description: "" })),
                  };
                  await api.post("/teams", payload);
                  showToast("Team created successfully");
                  setTeamForm({ teamName: "", leaderId: "", leaderName: "", researchFocus: "", department: "", teamMembers: [], projects: [{ title: "", status: "Planning" }] });
                } catch (err) {
                  showToast(err.response?.data?.message || "Failed to create team");
                  console.error(err);
                } finally {
                  setLoading(false);
                }
              }}>Create Team</button>
            </div>
          </div>
        )}

        {tab === "create-announcement" && (
          <div>
            <h1 style={s.pageTitle}>Create Announcement</h1>
            <p style={s.pageSubtitle}>Announcements will appear in the News feed for all users.</p>

            <div style={s.annLayout}>
              <div style={s.form}>
                <div style={s.group}>
                  <label style={s.label}>Title <span style={s.req}>*</span></label>
                  <input style={s.input} value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} placeholder="Announcement title..." />
                </div>

                <div style={s.formRow}>
                  <div style={{ ...s.group, flex: 1 }}>
                    <label style={s.label}>Type <span style={s.req}>*</span></label>
                    <select style={s.input} value={annForm.type} onChange={(e) => setAnnForm({ ...annForm, type: e.target.value })}>
                      {ANN_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ ...s.group, flex: 1 }}>
                    <label style={s.label}>Date <span style={s.req}>*</span></label>
                    <input style={s.input} type="date" value={annForm.date} onChange={(e) => setAnnForm({ ...annForm, date: e.target.value })} />
                  </div>
                </div>

                <div style={s.group}>
                  <label style={s.label}>Author <span style={s.req}>*</span></label>
                  <input style={s.input} value={annForm.author} onChange={(e) => setAnnForm({ ...annForm, author: e.target.value })} placeholder="e.g. Prof. Amina Boudali" />
                </div>

                <div style={s.group}>
                  <label style={s.label}>Short Description <span style={s.req}>*</span></label>
                  <input style={s.input} value={annForm.shortDesc} onChange={(e) => setAnnForm({ ...annForm, shortDesc: e.target.value })} placeholder="Brief summary shown on cards..." />
                </div>

                <div style={s.group}>
                  <label style={s.label}>Full Description <span style={s.req}>*</span></label>
                  <textarea style={{ ...s.textarea, minHeight: "120px" }} value={annForm.fullDesc} onChange={(e) => setAnnForm({ ...annForm, fullDesc: e.target.value })} placeholder="Full story shown when clicking the announcement..." rows={5} />
                </div>

                <div style={s.group}>
                  <label style={s.label}>Cover Image <span style={s.hint}>(optional)</span></label>
                  <label style={s.imgUploadBox}>
                    <input type="file" accept="image/*" onChange={handleAnnImage} style={{ display: "none" }} />
                    {annForm.imagePreview ? (
                      <div style={s.imgPreviewWrap}>
                        <img src={annForm.imagePreview} alt="preview" style={s.imgPreview} />
                        <span style={s.changeImg}>Change Image</span>
                      </div>
                    ) : (
                      <div style={s.imgPlaceholder}>
                        <span style={s.imgIcon}>🖼️</span>
                        <span style={s.imgText}>Click to upload cover image</span>
                      </div>
                    )}
                  </label>
                </div>

                {annError && <div style={s.annError}>{annError}</div>}
                <button style={s.submitBtn} onClick={submitAnnouncement}>Post Announcement</button>
              </div>

              <div style={s.annList}>
                <h3 style={s.annListTitle}>Posted Announcements</h3>
                {announcements.length === 0 ? (
                  <p style={s.empty}>No announcements posted yet.</p>
                ) : (
                  [...announcements].reverse().map((a) => (
                    <div key={a._id || a.id} style={s.annItem}>
                      {a.image && <img src={a.image} alt={a.headline} style={s.annItemImg} />}
                      <div style={s.annItemBody}>
                        <span style={s.annItemBadge}>{a.category}</span>
                        <p style={s.annItemTitle}>{a.headline}</p>
                        <p style={s.annItemMeta}>{a.date} · {a.author}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "manage-members" && (
          <div>
            <h1 style={s.pageTitle}>Manage Members</h1>
            <table style={s.table}>
              <thead>
                <tr>{["Member", "Role", "Team", "Status"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {adminMembers.map((m) => {
                  const state = memberActive.find((x) => x.id === m._id);
                  return (
                    <tr key={m._id} style={s.tr}>
                      <td style={s.td}><div style={s.memberName}>{m.fullName}</div></td>
                      <td style={s.td}><span style={s.roleBadge}>{m.academicRole}</span></td>
                      <td style={s.td}><span style={s.teamName}>{m.team?.teamName || "—"}</span></td>
                      <td style={s.td}>
                        <button style={{ ...s.toggleBtn, background: state?.active ? "#059669" : "#9CA3AF" }} onClick={async () => {
                          const userId = m.user?._id;
                          if (!userId) {
                            showToast("No user account linked to this member");
                            return;
                          }
                          const nextActive = !state?.active;
                          try {
                            await api.put(`/auth/users/${userId}`, { isActive: nextActive });
                            setMemberActive(memberActive.map((x) => x.id === m._id ? { ...x, active: nextActive } : x));
                            showToast(nextActive ? "Member activated" : "Member deactivated");
                          } catch (err) {
                            showToast("Failed to update member status");
                            console.error(err);
                          }
                        }}>
                          {state?.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  layout: { display: "flex", minHeight: "calc(100vh - 64px)" },
  sidebar: { width: "220px", background: "#0F172A", padding: "1.5rem 1rem", flexShrink: 0 },
  sideTitle: { color: "#fff", fontSize: "1rem", fontWeight: 700, marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid #1E293B" },
  sideBtn: { display: "block", width: "100%", padding: "0.6rem 0.75rem", marginBottom: "0.4rem", background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", borderRadius: "0.375rem", textAlign: "left", fontSize: "0.875rem" },
  sideBtnActive: { background: "#4F46E5", color: "#fff" },
  content: { flex: 1, padding: "2rem 2.5rem", background: "#f9fafb", position: "relative", overflowY: "auto" },
  toast: { position: "fixed", top: "80px", right: "2rem", background: "#111827", color: "#fff", padding: "0.75rem 1.25rem", borderRadius: "0.5rem", zIndex: 9999, fontSize: "0.875rem" },
  pageTitle: { fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.4rem" },
  pageSubtitle: { color: "#6B7280", fontSize: "0.875rem", marginBottom: "1.5rem" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "2rem" },
  statCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.25rem", textAlign: "center" },
  statVal: { fontSize: "2rem", fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: "0.75rem", color: "#6B7280", marginTop: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" },
  sectionTitle: { fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: "1.5rem 0 1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #e5e7eb" },
  queueRow: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1rem 1.25rem", marginBottom: "0.75rem" },
  qName: { fontWeight: 600, color: "#111827", marginBottom: "0.2rem" },
  qMeta: { fontSize: "0.8rem", color: "#6B7280" },
  qActions: { display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" },
  approveBtn: { padding: "0.4rem 1rem", background: "#059669", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500 },
  rejectBtn: { padding: "0.4rem 1rem", background: "#DC2626", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500 },
  rejectBox: { marginTop: "0.75rem", display: "flex", gap: "0.5rem" },
  rejectInput: { flex: 1, padding: "0.4rem 0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem", fontSize: "0.8rem" },
  rejectConfirm: { padding: "0.4rem 0.75rem", background: "#111827", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.8rem" },
  empty: { color: "#9CA3AF", fontSize: "0.875rem", padding: "1rem 0" },
  emptyBox: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "2rem", textAlign: "center" },
  pubReviewCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.25rem 1.5rem", marginBottom: "1rem", borderLeft: "4px solid #4F46E5" },
  pubReviewTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" },
  pubReviewInfo: { flex: 1 },
  pubTypeBadge: { background: "#EEF2FF", color: "#4F46E5", padding: "0.15rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 600 },
  pubReviewTitle: { fontSize: "1rem", fontWeight: 600, color: "#111827", margin: "0.4rem 0 0.2rem" },
  pubReviewMeta: { fontSize: "0.8rem", color: "#6B7280" },
  pubPdfLink: { color: "#4F46E5", fontSize: "0.8rem", textDecoration: "none", fontWeight: 500, display: "inline-block", marginTop: "0.4rem" },
  form: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.5rem", maxWidth: "620px", display: "flex", flexDirection: "column", gap: "1rem" },
  formRow: { display: "flex", gap: "1rem" },
  group: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.875rem", fontWeight: 500, color: "#111827" },
  req: { color: "#DC2626" },
  hint: { color: "#9CA3AF", fontWeight: 400, fontSize: "0.8rem" },
  input: { padding: "0.6rem 0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem", fontSize: "0.875rem" },
  textarea: { padding: "0.6rem 0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem", fontSize: "0.875rem", resize: "vertical" },
  projectRow: { display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" },
  removeBtn: { background: "none", border: "1px solid #e5e7eb", borderRadius: "0.25rem", cursor: "pointer", padding: "0.4rem 0.5rem", color: "#DC2626" },
  addBtn: { padding: "0.4rem 0.75rem", background: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500, alignSelf: "flex-start" },
  submitBtn: { padding: "0.7rem", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: 500, fontSize: "0.95rem" },
  annLayout: { display: "grid", gridTemplateColumns: "1fr 320px", gap: "2rem", alignItems: "start" },
  annError: { background: "#fef2f2", border: "1px solid #fecaca", color: "#DC2626", padding: "0.6rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.8rem" },
  imgUploadBox: { display: "block", border: "2px dashed #C7D2FE", borderRadius: "0.5rem", cursor: "pointer", overflow: "hidden" },
  imgPlaceholder: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1.5rem" },
  imgIcon: { fontSize: "2rem" },
  imgText: { fontSize: "0.875rem", color: "#6B7280" },
  imgPreviewWrap: { position: "relative" },
  imgPreview: { width: "100%", height: "160px", objectFit: "cover", display: "block" },
  changeImg: { position: "absolute", bottom: "0.5rem", right: "0.5rem", background: "rgba(0,0,0,0.6)", color: "#fff", padding: "0.2rem 0.6rem", borderRadius: "0.25rem", fontSize: "0.75rem" },
  annList: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.25rem", position: "sticky", top: "80px" },
  annListTitle: { fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #EEF2FF" },
  annItem: { display: "flex", gap: "0.75rem", marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f3f4f6" },
  annItemImg: { width: "60px", height: "45px", objectFit: "cover", borderRadius: "0.375rem", flexShrink: 0 },
  annItemBody: { flex: 1 },
  annItemBadge: { background: "#EEF2FF", color: "#4F46E5", padding: "0.1rem 0.5rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 600 },
  annItemTitle: { fontSize: "0.8rem", fontWeight: 600, color: "#111827", margin: "0.2rem 0 0.1rem", lineHeight: 1.3 },
  annItemMeta: { fontSize: "0.7rem", color: "#9CA3AF" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "0.75rem", overflow: "hidden", border: "1px solid #e5e7eb" },
  th: { padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "0.75rem 1rem", fontSize: "0.875rem" },
  memberName: { fontWeight: 500, color: "#111827" },
  roleBadge: { background: "#EEF2FF", color: "#4F46E5", padding: "0.2rem 0.5rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600 },
  teamName: { color: "#6B7280", fontSize: "0.8rem" },
  toggleBtn: { color: "#fff", border: "none", padding: "0.3rem 0.75rem", borderRadius: "9999px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 },
  degreeBtn: { padding: "0.4rem 1rem", background: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  degreeModalBox: { background: "#fff", borderRadius: "0.75rem", padding: "1.5rem", width: "90%", maxWidth: "800px", maxHeight: "90vh", display: "flex", flexDirection: "column", gap: "1rem" },
  degreeModalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  degreeModalTitle: { fontWeight: 600, color: "#111827", fontSize: "1rem" },
  closeBtn: { background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", color: "#6B7280" },
  pdfFrame: { width: "100%", height: "500px", border: "1px solid #e5e7eb", borderRadius: "0.5rem" },
  downloadBtn: { display: "inline-block", padding: "0.5rem 1.25rem", background: "#4F46E5", color: "#fff", borderRadius: "0.375rem", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, alignSelf: "flex-start" },
  loadingBar: { background: "#EEF2FF", color: "#4F46E5", padding: "0.4rem 1rem", borderRadius: "0.375rem", fontSize: "0.8rem", fontWeight: 600, marginBottom: "1rem", textAlign: "center" },
};
