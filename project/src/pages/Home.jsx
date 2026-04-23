import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Home() {
  const [news, setNews] = useState([]);
  const [pubs, setPubs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({ totalMembers: 0, totalTeams: 0, totalPublications: 0, totalDepartments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      setError("");
      let fetchErrors = [];

      // Fetch each resource independently so one failure doesn't block the rest
      try {
        console.log("[Home] Fetching /news ...");
        const newsRes = await api.get("/news");
        console.log("[Home] /news response:", newsRes.data);
        setNews(newsRes.data.data?.slice(0, 3) || []);
      } catch (err) {
        console.error("[Home] Failed to fetch /news:", err.response?.status, err.response?.data?.message || err.message);
        fetchErrors.push("news");
      }

      try {
        console.log("[Home] Fetching /publications ...");
        const pubsRes = await api.get("/publications");
        console.log("[Home] /publications response:", pubsRes.data);
        setPubs(pubsRes.data.data?.slice(0, 4) || []);
      } catch (err) {
        console.error("[Home] Failed to fetch /publications:", err.response?.status, err.response?.data?.message || err.message);
        fetchErrors.push("publications");
      }

      try {
        console.log("[Home] Fetching /departments ...");
        const deptsRes = await api.get("/departments");
        console.log("[Home] /departments response:", deptsRes.data);
        setDepartments(deptsRes.data.data || []);
      } catch (err) {
        console.error("[Home] Failed to fetch /departments:", err.response?.status, err.response?.data?.message || err.message);
        fetchErrors.push("departments");
      }

      try {
        console.log("[Home] Fetching /stats ...");
        const statsRes = await api.get("/stats");
        console.log("[Home] /stats response:", statsRes.data);
        if (statsRes?.data?.data) {
          setStats(statsRes.data.data);
        }
      } catch (err) {
        console.error("[Home] Failed to fetch /stats:", err.response?.status, err.response?.data?.message || err.message);
        fetchErrors.push("stats");
      }

      if (fetchErrors.length > 0) {
        setError(`Failed to load: ${fetchErrors.join(", ")}. Check console for details.`);
      }
      setLoading(false);
    };

    fetchHomeData();
  }, []);

  return (
    <main>
      {/* HERO */}
      <section style={s.hero}>
        <div style={s.heroContent}>
          <h1 style={s.heroTitle}>Welcome to <span style={s.accent}>Research Lab</span></h1>
          <p style={s.heroSub}>Advancing scientific discovery through collaborative research, cutting-edge innovation, and academic excellence.</p>
          <div style={s.heroActions}>
            <Link to="/teams" style={s.btnPrimary}>Explore Research</Link>
            <Link to="/publications" style={s.btnOutline}>View Publications</Link>
          </div>
        </div>
      </section>

      {/* ERROR BANNER */}
      {error && (
        <section style={s.errorSection}>
          <div style={s.errorBanner}>{error}</div>
        </section>
      )}

      {/* LOADING STATE */}
      {loading && (
        <section style={s.loadingSection}>
          <div style={s.spinner}>Loading data...</div>
        </section>
      )}

      {/* STATS */}
      <section style={s.statsSection}>
        <div style={s.statsGrid}>
          {[
            { label: "Total Members", value: stats.totalMembers },
            { label: "Research Teams", value: stats.totalTeams },
            { label: "Publications", value: stats.totalPublications },
            { label: "Departments", value: stats.totalDepartments },
          ].map((stat) => (
            <div key={stat.label} style={s.statCard}>
              <div style={s.statValue}>{stat.value}</div>
              <div style={s.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* NEWS */}
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Featured News</h2>
          <p style={s.sectionSub}>Latest updates from our research community</p>
        </div>
        <div style={s.newsGrid}>
          {news.map((item) => (
            <Link to={`/news/${item._id}`} key={item._id} style={s.newsCard}>
              <img src={item.image} alt={item.headline} style={s.newsImg} />
              <div style={s.newsBody}>
                <div style={s.newsMeta}>
                  <span style={s.badge}>{item.category}</span>
                  <span style={s.newsDate}>{new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <h3 style={s.newsTitle}>{item.headline}</h3>
                <p style={s.newsSummary}>{item.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PUBLICATIONS */}
      <section style={{ ...s.section, background: "#f9fafb" }}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Latest Publications</h2>
          <p style={s.sectionSub}>Recent research papers and academic works</p>
        </div>
        <div style={s.pubGrid}>
          {pubs.map((pub) => (
            <div key={pub._id} style={s.pubCard}>
              <span style={s.badge}>{pub.type}</span>
              <h3 style={s.pubTitle}>{pub.title}</h3>
              <p style={s.pubAuthors}>{(pub.authors || []).join(", ")} · {pub.year}</p>
              <p style={s.pubPublisher}>{pub.publisher}</p>
              {pub.pdfLink && <a href={pub.pdfLink} target="_blank" rel="noreferrer" style={s.pdfLink}>Read PDF →</a>}
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link to="/publications" style={s.btnOutline}>View All Publications</Link>
        </div>
      </section>

      {/* DEPARTMENTS */}
      <section style={s.deptSection}>
        <p style={s.deptLabel}>Our Research Departments</p>
        <div style={s.deptScroll}>
          {departments.map((d) => (
            <div key={d._id} style={s.deptChip}>
              <span style={s.deptName}>{d.name}</span>
              <span style={s.deptCode}>{d.code}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const s = {
  errorSection: { background: "#FEF2F2", padding: "1rem 1.5rem", borderBottom: "1px solid #FECACA" },
  errorBanner: { maxWidth: "1200px", margin: "0 auto", color: "#DC2626", fontSize: "0.9rem", fontWeight: 500 },
  loadingSection: { background: "#fff", padding: "2rem 1.5rem", textAlign: "center" },
  spinner: { color: "#6B7280", fontSize: "0.9rem" },
  hero: { background: "linear-gradient(135deg,#EEF2FF 0%,#fff 100%)", padding: "6rem 1.5rem", textAlign: "center" },
  heroContent: { maxWidth: "780px", margin: "0 auto" },
  heroTitle: { fontSize: "3rem", fontWeight: 800, color: "#111827", marginBottom: "1rem", lineHeight: 1.1 },
  accent: { color: "#4F46E5" },
  heroSub: { fontSize: "1.15rem", color: "#6B7280", marginBottom: "2rem", maxWidth: "580px", margin: "0 auto 2rem" },
  heroActions: { display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" },
  btnPrimary: { background: "#4F46E5", color: "#fff", padding: "0.65rem 1.5rem", borderRadius: "0.375rem", textDecoration: "none", fontWeight: 500 },
  btnOutline: { background: "transparent", color: "#111827", padding: "0.65rem 1.5rem", borderRadius: "0.375rem", textDecoration: "none", fontWeight: 500, border: "1px solid #d1d5db" },
  statsSection: { background: "#fff", padding: "3rem 1.5rem", borderBottom: "1px solid #e5e7eb" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.5rem", maxWidth: "1200px", margin: "0 auto" },
  statCard: { textAlign: "center", padding: "1.5rem", background: "#EEF2FF", borderRadius: "0.75rem" },
  statValue: { fontSize: "2.5rem", fontWeight: 800, color: "#4F46E5", lineHeight: 1 },
  statLabel: { fontSize: "0.8rem", color: "#6B7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.4rem" },
  section: { padding: "4rem 1.5rem", background: "#fff" },
  sectionHeader: { textAlign: "center", marginBottom: "2.5rem" },
  sectionTitle: { fontSize: "1.75rem", fontWeight: 700, color: "#111827" },
  sectionSub: { color: "#6B7280", marginTop: "0.5rem" },
  newsGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.5rem", maxWidth: "1200px", margin: "0 auto" },
  newsCard: { background: "#fff", borderRadius: "0.75rem", border: "1px solid #e5e7eb", overflow: "hidden", textDecoration: "none", color: "inherit", display: "block", transition: "transform 0.2s" },
  newsImg: { width: "100%", height: "180px", objectFit: "cover" },
  newsBody: { padding: "1.25rem" },
  newsMeta: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" },
  badge: { background: "#EEF2FF", color: "#4F46E5", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600 },
  newsDate: { fontSize: "0.8rem", color: "#6B7280" },
  newsTitle: { fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "0.4rem", lineHeight: 1.4 },
  newsSummary: { fontSize: "0.85rem", color: "#6B7280", lineHeight: 1.5 },
  pubGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1.25rem", maxWidth: "1200px", margin: "0 auto" },
  pubCard: { background: "#fff", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb", borderLeft: "4px solid #4F46E5" },
  pubTitle: { fontSize: "1rem", fontWeight: 600, color: "#111827", margin: "0.5rem 0" },
  pubAuthors: { fontSize: "0.85rem", color: "#6B7280" },
  pubPublisher: { fontSize: "0.8rem", color: "#9CA3AF", marginTop: "0.25rem" },
  pdfLink: { color: "#4F46E5", fontSize: "0.85rem", fontWeight: 500, textDecoration: "none", marginTop: "0.75rem", display: "inline-block" },
  deptSection: { background: "#EEF2FF", padding: "2rem 1.5rem" },
  deptLabel: { textAlign: "center", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280", marginBottom: "1rem" },
  deptScroll: { display: "flex", gap: "1rem", overflowX: "auto", maxWidth: "1200px", margin: "0 auto", padding: "0.5rem" },
  deptChip: { flexShrink: 0, display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1.25rem", background: "#fff", borderRadius: "0.5rem", border: "1px solid #e5e7eb" },
  deptName: { fontWeight: 600, color: "#111827", whiteSpace: "nowrap" },
  deptCode: { fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: "#EEF2FF", color: "#4F46E5", borderRadius: "0.25rem", fontWeight: 600 },
};
