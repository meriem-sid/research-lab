import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

export default function NewsArticle() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/news/${id}`);
        setArticle(data.data);
      } catch (err) {
        console.error("Failed to fetch article:", err);
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Loading article...</h2>
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Article not found</h2>
        <Link to="/news" style={{ color: "#4F46E5" }}>← Back to News</Link>
      </div>
    );
  }

  return (
    <main style={s.page}>
      <Link to="/news" style={s.back}>← Back to News</Link>
      <div style={s.header}>
        <span style={s.badge}>{article.category}</span>
        <h1 style={s.title}>{article.headline}</h1>
        <div style={s.meta}>
          <span>{new Date(article.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          <span>·</span>
          <span>{article.author}</span>
        </div>
      </div>
      {article.image && <img src={article.image} alt={article.headline} style={s.img} onError={(e) => { e.target.style.display = "none"; }} />}
      <div style={s.body}><p>{article.fullStory}</p></div>
    </main>
  );
}

const s = {
  page: { maxWidth: "780px", margin: "0 auto", padding: "3rem 1.5rem" },
  back: { color: "#4F46E5", textDecoration: "none", fontSize: "0.9rem", display: "inline-block", marginBottom: "2rem" },
  header: { marginBottom: "1.5rem" },
  badge: { background: "#EEF2FF", color: "#4F46E5", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600 },
  title: { fontSize: "2rem", fontWeight: 800, color: "#111827", margin: "0.75rem 0", lineHeight: 1.2 },
  meta: { display: "flex", gap: "0.75rem", color: "#6B7280", fontSize: "0.875rem" },
  img: { width: "100%", height: "360px", objectFit: "cover", borderRadius: "0.75rem", marginBottom: "2rem" },
  body: { fontSize: "1.1rem", lineHeight: 1.8, color: "#374151" },
};
