import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const CATEGORIES = ["All", "Event", "Award", "Publication", "Seminar", "Announcement", "General"];
const PER_PAGE = 6;

export default function NewsPage() {
  const [cat, setCat] = useState("All");
  const [page, setPage] = useState(1);
  const [allNews, setAllNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (cat !== "All") params.append("category", cat);
        params.append("page", String(page));
        params.append("limit", String(PER_PAGE));
        const { data } = await api.get(`/news?${params.toString()}`);
        setAllNews(data.data || []);
        setTotalItems(data.total || 0);
      } catch (err) {
        console.error("Failed to fetch news:", err);
        setAllNews([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [cat, page]);

  const totalPages = Math.ceil(totalItems / PER_PAGE);
  const paginated = allNews;

  if (loading) {
    return (
      <main style={s.page}>
        <div style={s.header}>
          <h1 style={s.title}>News Feed</h1>
          <p style={s.sub}>Loading news...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>News Feed</h1>
        <p style={s.sub}>Latest updates from the lab</p>
      </div>

      <div style={s.tabs}>
        {CATEGORIES.map((c) => (
          <button key={c} style={{ ...s.tab, ...(cat === c ? s.tabActive : {}) }} onClick={() => { setCat(c); setPage(1); }}>{c}</button>
        ))}
      </div>

      <div style={s.grid}>
        {paginated.map((item) => (
          <Link to={`/news/${item._id}`} key={item._id} style={s.card}>
            <img src={item.image} alt={item.headline} style={s.img} />
            <div style={s.body}>
              <div style={s.meta}>
                <span style={s.badge}>{item.category}</span>
                <span style={s.date}>{new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              <h3 style={s.cardTitle}>{item.headline}</h3>
              <p style={s.summary}>{item.summary}</p>
              <p style={s.author}>By {item.author}</p>
            </div>
          </Link>
        ))}
      </div>

      {allNews.length === 0 && <p style={s.empty}>No news in this category.</p>}

      {totalPages > 1 && (
        <div style={s.pagination}>
          <button style={s.pageBtn} disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span style={s.pageInfo}>Page {page} of {totalPages}</span>
          <button style={s.pageBtn} disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </main>
  );
}

const s = {
  page: { maxWidth: "1200px", margin: "0 auto", padding: "3rem 1.5rem" },
  header: { textAlign: "center", marginBottom: "2rem" },
  title: { fontSize: "2rem", fontWeight: 700, color: "#111827" },
  sub: { color: "#6B7280", marginTop: "0.5rem" },
  tabs: { display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem", justifyContent: "center" },
  tab: { padding: "0.4rem 1rem", borderRadius: "9999px", border: "1px solid #e5e7eb", background: "#fff", color: "#6B7280", cursor: "pointer", fontSize: "0.875rem" },
  tabActive: { background: "#4F46E5", color: "#fff", border: "1px solid #4F46E5" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.5rem" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", overflow: "hidden", textDecoration: "none", color: "inherit", display: "block" },
  img: { width: "100%", height: "180px", objectFit: "cover" },
  body: { padding: "1.25rem" },
  meta: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" },
  badge: { background: "#EEF2FF", color: "#4F46E5", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600 },
  date: { fontSize: "0.8rem", color: "#9CA3AF" },
  cardTitle: { fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "0.4rem", lineHeight: 1.4 },
  summary: { fontSize: "0.85rem", color: "#6B7280", lineHeight: 1.5, marginBottom: "0.5rem" },
  author: { fontSize: "0.8rem", color: "#9CA3AF" },
  empty: { textAlign: "center", color: "#9CA3AF", padding: "3rem" },
  pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "2rem" },
  pageBtn: { padding: "0.5rem 1.25rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem", background: "#fff", cursor: "pointer" },
  pageInfo: { color: "#6B7280", fontSize: "0.875rem" },
};
