import { useState, useEffect } from "react";
import api from "../services/api";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [memberData, setMemberData] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    fullName: "",
    specialization: "",
    bio: "",
    age: "",
    faculty: "",
    linkedIn: "",
    googleScholar: "",
    photoUrl: "",
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/auth/me");
        const user = data.data;
        const member = user?.memberProfile || null;
        setMemberData(member);

        setForm({
          name: user?.name || "",
          email: user?.email || "",
          password: "",
          fullName: member?.fullName || user?.name || "",
          specialization: member?.specialization || "",
          bio: member?.bio || "",
          age: member?.age ?? "",
          faculty: member?.faculty || "",
          linkedIn: member?.linkedIn || "",
          googleScholar: member?.googleScholar || "",
          photoUrl: member?.photoUrl || "",
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
        showToast("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update user account fields
      const userPayload = {};
      if (form.name.trim()) userPayload.name = form.name.trim();
      if (form.email.trim()) userPayload.email = form.email.trim();
      if (form.password.trim()) userPayload.password = form.password.trim();

      if (Object.keys(userPayload).length > 0) {
        await api.put("/auth/me", userPayload);
      }

      // Update member profile fields
      if (memberData?._id) {
        const memberPayload = {
          fullName: form.fullName.trim(),
          specialization: form.specialization.trim(),
          bio: form.bio.trim(),
          age: form.age === "" ? null : Number(form.age),
          faculty: form.faculty.trim(),
          linkedIn: form.linkedIn.trim(),
          googleScholar: form.googleScholar.trim(),
          photoUrl: form.photoUrl.trim(),
        };
        await api.put(`/members/${memberData._id}`, memberPayload);
      }

      // Refresh profile from server to ensure consistency
      const { data } = await api.get("/auth/me");
      const updatedUser = data.data;
      const updatedMember = updatedUser?.memberProfile || null;
      setMemberData(updatedMember);

      setForm({
        name: updatedUser?.name || "",
        email: updatedUser?.email || "",
        password: "",
        fullName: updatedMember?.fullName || updatedUser?.name || "",
        specialization: updatedMember?.specialization || "",
        bio: updatedMember?.bio || "",
        age: updatedMember?.age ?? "",
        faculty: updatedMember?.faculty || "",
        linkedIn: updatedMember?.linkedIn || "",
        googleScholar: updatedMember?.googleScholar || "",
        photoUrl: updatedMember?.photoUrl || "",
      });

      // Refresh localStorage user name
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      storedUser.name = updatedUser?.name || form.name;
      localStorage.setItem("user", JSON.stringify(storedUser));
      localStorage.setItem("userName", storedUser.name);

      showToast("Profile updated successfully");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update profile";
      showToast(msg);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>My Profile</h1>
          <p style={styles.sub}>Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      {toast && <div style={styles.toast}>{toast}</div>}

      <div style={styles.header}>
        <h1 style={styles.title}>My Profile</h1>
        <p style={styles.sub}>View and update your account and member information</p>
      </div>

      <div style={styles.grid}>
        {/* Account Info */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Account Information</h2>
          <div style={styles.form}>
            <div style={styles.group}>
              <label style={styles.label}>Name</label>
              <input style={styles.input} name="name" value={form.name} onChange={handleChange} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Email</label>
              <input style={styles.input} name="email" value={form.email} onChange={handleChange} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>New Password <span style={styles.hint}>(leave blank to keep current)</span></label>
              <input style={styles.input} name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" />
            </div>
          </div>
        </section>

        {/* Member Profile */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Member Profile</h2>
          <div style={styles.form}>
            <div style={styles.group}>
              <label style={styles.label}>Full Name</label>
              <input style={styles.input} name="fullName" value={form.fullName} onChange={handleChange} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Specialization</label>
              <input style={styles.input} name="specialization" value={form.specialization} onChange={handleChange} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Bio</label>
              <textarea style={{ ...styles.input, minHeight: "80px", resize: "vertical" }} name="bio" value={form.bio} onChange={handleChange} rows={3} />
            </div>
            <div style={styles.row}>
              <div style={{ ...styles.group, flex: 1 }}>
                <label style={styles.label}>Age</label>
                <input style={styles.input} name="age" type="number" value={form.age} onChange={handleChange} />
              </div>
              <div style={{ ...styles.group, flex: 2 }}>
                <label style={styles.label}>Faculty</label>
                <input style={styles.input} name="faculty" value={form.faculty} onChange={handleChange} />
              </div>
            </div>
            <div style={styles.group}>
              <label style={styles.label}>LinkedIn URL</label>
              <input style={styles.input} name="linkedIn" type="url" value={form.linkedIn} onChange={handleChange} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Google Scholar URL</label>
              <input style={styles.input} name="googleScholar" type="url" value={form.googleScholar} onChange={handleChange} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Photo URL</label>
              <input style={styles.input} name="photoUrl" type="url" value={form.photoUrl} onChange={handleChange} />
            </div>
            {form.photoUrl && (
              <img src={form.photoUrl} alt="Preview" style={styles.photoPreview} onError={(e) => { e.target.style.display = "none"; }} />
            )}
          </div>
        </section>
      </div>

      <div style={styles.actions}>
        <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </main>
  );
}

const styles = {
  page: { maxWidth: "960px", margin: "0 auto", padding: "3rem 1.5rem" },
  header: { textAlign: "center", marginBottom: "2.5rem" },
  title: { fontSize: "2rem", fontWeight: 700, color: "#111827" },
  sub: { color: "#6B7280", marginTop: "0.5rem" },
  toast: { position: "fixed", top: "80px", right: "2rem", background: "#111827", color: "#fff", padding: "0.6rem 1rem", borderRadius: "0.5rem", zIndex: 9999, fontSize: "0.875rem" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "1.5rem" },
  cardTitle: { fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #EEF2FF" },
  form: { display: "flex", flexDirection: "column", gap: "0.9rem" },
  group: { display: "flex", flexDirection: "column", gap: "0.3rem" },
  label: { fontSize: "0.8rem", fontWeight: 500, color: "#374151" },
  hint: { color: "#9CA3AF", fontWeight: 400, fontSize: "0.75rem" },
  input: { padding: "0.55rem 0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem", fontSize: "0.875rem" },
  row: { display: "flex", gap: "0.75rem" },
  photoPreview: { width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb", marginTop: "0.25rem" },
  actions: { marginTop: "1.5rem", textAlign: "center" },
  saveBtn: { padding: "0.65rem 2rem", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem" },
};
