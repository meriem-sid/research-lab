import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={s.footer}>
      <div style={s.grid}>
        <div>
          <h3 style={s.brand}>Research Lab</h3>
          <p style={s.desc}>Advancing the frontiers of science through collaborative research, innovation, and academic excellence.</p>
        </div>
        <div>
          <h4 style={s.heading}>Quick Links</h4>
          {[["Home","/"],["Teams","/teams"],["Publications","/publications"],["Members","/members"],["News","/news"]].map(([n,t]) => (
            <Link key={n} to={t} style={s.link}>{n}</Link>
          ))}
        </div>
        <div>
          <h4 style={s.heading}>Contact</h4>
          <p style={s.contact}>123 Research Avenue, Academic District</p>
          <p style={s.contact}>contact@researchlab.edu</p>
          <p style={s.contact}>+213 123 4567</p>
        </div>
      </div>
      <div style={s.bottom}>© {year} Research Lab. All rights reserved.</div>
    </footer>
  );
}

const s = {
  footer: { background: "#0F172A", color: "#94A3B8", marginTop: "auto" },
  grid: { maxWidth: "1200px", margin: "0 auto", padding: "3rem 1.5rem", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "3rem" },
  brand: { color: "#fff", fontSize: "1.25rem", marginBottom: "0.75rem" },
  desc: { fontSize: "0.875rem", lineHeight: 1.6 },
  heading: { color: "#fff", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" },
  link: { display: "block", color: "#94A3B8", textDecoration: "none", fontSize: "0.875rem", marginBottom: "0.4rem" },
  contact: { fontSize: "0.875rem", marginBottom: "0.4rem" },
  bottom: { borderTop: "1px solid #1E293B", padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "0.875rem", color: "#64748B" },
};
