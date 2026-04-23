import { useState, useEffect } from "react";
import api from "../services/api";
import SearchableSelect from "../components/SearchableSelect";

export default function Publications() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [citeModal, setCiteModal] = useState(null);
  const [citeTab, setCiteTab] = useState("bibtex");
  const [copied, setCopied] = useState(false);
  const [postModal, setPostModal] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", authors: "", year: "", publisher: "", type: "Journal Article", pdfLink: "", tags: "", team: "", abstract: "" });
  const [postError, setPostError] = useState("");
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiTeams, setApiTeams] = useState([]);
  const PER_PAGE = 4;

  let user;
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }
  const canPost = user.role === "team_leader" || user.role === "member";

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchPublications = async () => {
      setLoading(true);
      setError("");
      try {
        console.log("[Publications] Fetching /publications ...");
        const { data } = await api.get("/publications");
        console.log("[Publications] Response:", data);
        setPublications(data.data || []);
      } catch (err) {
        console.error("[Publications] Failed to fetch:", err.response?.status, err.response?.data?.message || err.message);
        setError(err.response?.data?.message || "Failed to load publications from server.");
        setPublications([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchTeams = async () => {
      try {
        const { data } = await api.get("/teams");
        setApiTeams(data.data || []);
      } catch (err) {
        console.error("[Publications] Failed to fetch teams:", err);
      }
    };

    fetchPublications();
    fetchTeams();
  }, []);

  const years = ["All", ...new Set(publications.map((p) => p.year))].sort((a, b) => a === "All" ? -1 : b - a);
  const types = ["All", ...new Set(publications.map((p) => p.type))];
  const teams = ["All"];

  const filtered = publications.filter((p) => {
    const q = debouncedQuery.toLowerCase();
    const matchQuery = !q || (p.title || "").toLowerCase().includes(q) || (p.authors || []).some((a) => (a || "").toLowerCase().includes(q));
    const matchYear = yearFilter === "All" || p.year === parseInt(yearFilter);
    const matchType = typeFilter === "All" || p.type === typeFilter;
    return matchQuery && matchYear && matchType;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const [citationText, setCitationText] = useState("");
  const [citationLoading, setCitationLoading] = useState(false);

  useEffect(() => {
    if (!citeModal) {
      setCitationText("");
      return;
    }
    const fetchCitation = async () => {
      setCitationLoading(true);
      try {
        const { data } = await api.get(`/publications/${citeModal._id}/cite?format=${citeTab}`);
        setCitationText(data.citation || "");
      } catch (err) {
        console.error("Failed to fetch citation:", err);
        setCitationText("Failed to load citation.");
      } finally {
        setCitationLoading(false);
      }
    };
    fetchCitation();
  }, [citeModal, citeTab]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePost = async () => {
    if (!postForm.title.trim() || !postForm.authors.trim() || !postForm.year || !postForm.publisher.trim()) {
      setPostError("Please fill in all required fields.");
      return;
    }
    
    try {
      await api.post("/publications", {
        title: postForm.title,
        authors: postForm.authors.split(",").map((a) => a.trim()),
        year: parseInt(postForm.year),
        publisher: postForm.publisher,
        type: postForm.type,
        pdfLink: postForm.pdfLink,
        tags: postForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        abstract: postForm.abstract.trim() || postForm.title.trim(),
        team: postForm.team || undefined,
      });

      setPostModal(false);
      setPostForm({ title: "", authors: "", year: "", publisher: "", type: "Journal Article", pdfLink: "", tags: "", team: "", abstract: "" });
      setPostError("");
      alert("Publication submitted successfully!");
    } catch (err) {
      setPostError(err.response?.data?.message || "Failed to submit publication");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <main style={s.page}>
        <div style={s.header}>
          <h1 style={s.title}>Publication Library</h1>
          <p style={s.sub}>Loading publications...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Publication Library</h1>
        <p style={s.sub}>Browse and cite our research output</p>
      </div>

      {error && <div style={s.errorBanner}>{error}</div>}

      <div style={s.filterRow}>
        <input style={s.search} placeholder="Search by title or author..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        {[ ["Year", years, yearFilter, setYearFilter], ["Type", types, typeFilter, setTypeFilter], ["Team", teams, teamFilter, setTeamFilter] ].map(([label, opts, val, setter]) => (
          <select key={label} style={s.select} value={val} onChange={(e) => { setter(e.target.value); setPage(1); }}>
            {opts.map((o) => <option key={o}>{o}</option>)}
          </select>
        ))}
        {canPost && <button style={s.postBtn} onClick={() => setPostModal(true)}>+ Post</button>}
      </div>

      <div style={s.mainLayout}>
        <div style={s.gridArea}>
          <div style={s.grid}>
            {paginated.map((pub) => (
              <div key={pub._id} style={s.card}>
                <div style={s.cardTop}>
                  <span style={s.badge}>{pub.type}</span>
                  <span style={s.citations}>{pub.citations} citations</span>
                </div>
                <h3 style={s.pubTitle}>{pub.title}</h3>
                <p style={s.authors}>{(pub.authors || []).join(", ")}</p>
                <p style={s.publisher}>{pub.publisher} · {pub.year}</p>
                <div style={s.tags}>{(pub.tags || []).map((t) => <span key={t} style={s.tag}>{t}</span>)}</div>
                <div style={s.cardActions}>
                  <a href={pub.pdfLink} target="_blank" rel="noreferrer" style={s.pdfBtn}>Read PDF</a>
                  <button style={s.citeBtn} onClick={() => { setCiteModal(pub); setCiteTab("bibtex"); }}>Cite</button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && <p style={s.empty}>No publications found.</p>}

          {totalPages > 1 && (
            <div style={s.pagination}>
              <button style={s.pageBtn} disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span style={s.pageInfo}>Page {page} of {totalPages}</span>
              <button style={s.pageBtn} disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </div>

      </div>

        {citeModal && (
        <div style={s.overlay} onClick={() => setCiteModal(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Cite Publication</h3>
              <button style={s.closeBtn} onClick={() => setCiteModal(null)}>✕</button>
            </div>
            <p style={s.modalPubTitle}>{citeModal.title}</p>
            <div style={s.tabs}>
              {["bibtex", "apa"].map((tab) => (
                <button key={tab} style={{ ...s.tab, ...(citeTab === tab ? s.tabActive : {}) }} onClick={() => setCiteTab(tab)}>
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
            {citationLoading ? (
              <pre style={s.citeText}>Loading citation...</pre>
            ) : (
              <pre style={s.citeText}>{citationText}</pre>
            )}
            <button style={s.copyBtn} onClick={() => handleCopy(citationText)} disabled={citationLoading || !citationText}>
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
          </div>
        </div>
      )}

      {canPost && postModal && (
        <div style={s.overlay} onClick={() => setPostModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Post a Publication</h3>
              <button style={s.closeBtn} onClick={() => setPostModal(false)}>✕</button>
            </div>
            <div style={s.postForm}>
              {[ ["Title *", "title", "text"], ["Authors (comma separated) *", "authors", "text"], ["Year *", "year", "number"], ["Publisher *", "publisher", "text"], ["PDF Link", "pdfLink", "url"], ["Tags (comma separated)", "tags", "text"] ].map(([label, key, type]) => (
                <div key={key} style={s.formGroup}>
                  <label style={s.formLabel}>{label}</label>
                  <input style={s.formInput} type={type} value={postForm[key]} onChange={(e) => setPostForm({ ...postForm, [key]: e.target.value })} />
                </div>
              ))}
              <div style={s.formGroup}>
                <label style={s.formLabel}>Abstract</label>
                <textarea style={{ ...s.formInput, minHeight: "80px", resize: "vertical" }} value={postForm.abstract} onChange={(e) => setPostForm({ ...postForm, abstract: e.target.value })} rows={3} placeholder="Brief summary of the publication..." />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Team</label>
                <SearchableSelect
                  options={apiTeams.map((t) => ({ value: t._id, label: t.teamName }))}
                  value={postForm.team}
                  onChange={(val) => setPostForm({ ...postForm, team: val })}
                  placeholder="Search and select a team..."
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Type</label>
                <select style={s.formInput} value={postForm.type} onChange={(e) => setPostForm({ ...postForm, type: e.target.value })}>
                  {["Journal Article", "Conference Paper", "Book Chapter", "Thesis", "Technical Report", "Preprint"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              {postError && <div style={s.postError}>{postError}</div>}
              <button style={s.submitPostBtn} onClick={handlePost}>Submit for Review</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const s = {
  page: { maxWidth: "1400px", margin: "0 auto", padding: "3rem 1.5rem" },
  header: { textAlign: "center", marginBottom: "2rem" },
  errorBanner: { background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "0.75rem 1rem", borderRadius: "0.5rem", marginBottom: "1.5rem", fontSize: "0.875rem" },
  title: { fontSize: "2rem", fontWeight: 700, color: "#111827" },
  sub: { color: "#6B7280", marginTop: "0.5rem" },
  filterRow: { display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem", alignItems: "center" },
  search: { flex: 2, minWidth: "200px", padding: "0.6rem 1rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem", fontSize: "0.875rem" },
  select: { flex: 1, minWidth: "120px", padding: "0.6rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem", fontSize: "0.875rem", background: "#fff" },
  postBtn: { padding: "0.6rem 1.4rem", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "0.375rem", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", flexShrink: 0 },
  mainLayout: { display: "block" },
  gridArea: {},
  grid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1.25rem" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.5rem", borderLeft: "4px solid #4F46E5" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" },
  badge: { background: "#EEF2FF", color: "#4F46E5", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600 },
  citations: { fontSize: "0.8rem", color: "#9CA3AF" },
  pubTitle: { fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "0.4rem", lineHeight: 1.4 },
  authors: { fontSize: "0.85rem", color: "#6B7280", marginBottom: "0.25rem" },
  publisher: { fontSize: "0.8rem", color: "#9CA3AF", marginBottom: "0.75rem" },
  tags: { display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" },
  tag: { background: "#f3f4f6", color: "#374151", padding: "0.15rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.7rem" },
  cardActions: { display: "flex", gap: "0.75rem" },
  pdfBtn: { padding: "0.4rem 1rem", background: "#4F46E5", color: "#fff", borderRadius: "0.375rem", textDecoration: "none", fontSize: "0.8rem", fontWeight: 500 },
  citeBtn: { padding: "0.4rem 1rem", background: "transparent", color: "#4F46E5", borderRadius: "0.375rem", border: "1px solid #4F46E5", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer" },
  empty: { textAlign: "center", color: "#9CA3AF", padding: "3rem" },
  pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "2rem" },
  pageBtn: { padding: "0.5rem 1.25rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem", background: "#fff", cursor: "pointer", fontSize: "0.875rem" },
  pageInfo: { color: "#6B7280", fontSize: "0.875rem" },
  sidebar: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.25rem", position: "sticky", top: "80px" },
  sidebarTitle: { fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #EEF2FF" },
  sidebarEmpty: { fontSize: "0.8rem", color: "#9CA3AF", textAlign: "center", padding: "1rem 0" },
  postedCard: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "0.6rem" },
  postedTitle: { fontSize: "0.82rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem", lineHeight: 1.4 },
  postedFooter: { display: "flex", justifyContent: "flex-end" },
  statusBadge: { fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.55rem", borderRadius: "9999px" },
  statusPending: { background: "#F3F4F6", color: "#6B7280" },
  statusRefused: { background: "#FEF2F2", color: "#DC2626" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  modal: { background: "#fff", borderRadius: "0.75rem", padding: "1.5rem", width: "100%", maxWidth: "520px", margin: "1rem", maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" },
  modalTitle: { fontWeight: 700, fontSize: "1.1rem", color: "#111827" },
  closeBtn: { background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", color: "#6B7280" },
  modalPubTitle: { fontSize: "0.85rem", color: "#6B7280", marginBottom: "1rem" },
  tabs: { display: "flex", gap: "0.5rem", marginBottom: "1rem" },
  tab: { padding: "0.4rem 1rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem", background: "#fff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 },
  tabActive: { background: "#4F46E5", color: "#fff", border: "1px solid #4F46E5" },
  citeText: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1rem", fontSize: "0.8rem", overflowX: "auto", whiteSpace: "pre-wrap", marginBottom: "1rem" },
  copyBtn: { width: "100%", padding: "0.6rem", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontWeight: 500 },
  postForm: { display: "flex", flexDirection: "column", gap: "0.9rem", marginTop: "1rem" },
  formGroup: { display: "flex", flexDirection: "column", gap: "0.3rem" },
  formLabel: { fontSize: "0.8rem", fontWeight: 500, color: "#374151" },
  formInput: { padding: "0.55rem 0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem", fontSize: "0.875rem" },
  postError: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.8rem" },
  submitPostBtn: { padding: "0.65rem", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" },
};
