import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const NoticesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [notices, setNotices]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({ type: "", text: "" });

  // Form state for creating a notice
  const [form, setForm] = useState({
    title: "", content: "", priority: "Normal", expiryDate: ""
  });

  // Fetch notices
  const fetchNotices = async () => {
    try {
      // Admins see all (including expired), cadets see only active
      const endpoint = isAdmin ? "/notices/all" : "/notices";
      const { data } = await api.get(endpoint);
      setNotices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Create new notice (admin only)
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      await api.post("/notices", form);
      setMsg({ type: "success", text: "Notice created successfully!" });
      setShowForm(false);
      setForm({ title: "", content: "", priority: "Normal", expiryDate: "" });
      fetchNotices(); // Refresh list
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to create notice" });
    } finally {
      setSaving(false);
    }
  };

  // Delete notice (admin only)
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notice?")) return;
    try {
      await api.delete(`/notices/${id}`);
      setNotices(notices.filter((n) => n._id !== id));
    } catch (err) {
      alert("Failed to delete notice");
    }
  };

  const isExpired = (date) => new Date(date) < new Date();

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">

        <div className="page-header flex-between">
          <div>
            <h1>Notices</h1>
            <p>{isAdmin ? "Manage all notices" : "Active notices from admin"}</p>
          </div>
          {isAdmin && (
            <button className="btn btn-navy" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "New Notice"}
            </button>
          )}
        </div>

        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        {/* Create Notice Form (admin only) */}
        {isAdmin && showForm && (
          <div className="card">
            <h2 style={{ marginBottom: 16 }}>Create New Notice</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title *</label>
                <input name="title" value={form.title} onChange={handleChange} required placeholder="Notice title" />
              </div>
              <div className="form-group">
                <label>Content *</label>
                <textarea name="content" value={form.content} onChange={handleChange} required rows={4} placeholder="Notice content..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={form.priority} onChange={handleChange}>
                    <option>Normal</option>
                    <option>Important</option>
                    <option>Urgent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Expiry Date *</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={form.expiryDate}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split("T")[0]} // Can't be in the past
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-navy" disabled={saving}>
                {saving ? <><span className="spinner" /> Posting...</> : "Post Notice"}
              </button>
            </form>
          </div>
        )}

        {/* Notices List */}
        {loading ? <p>Loading notices...</p> : notices.length === 0 ? (
          <div className="card text-center" style={{ padding: 40 }}>
            <p style={{ color: "var(--gray)", fontSize: 16 }}>No notices at this time.</p>
          </div>
        ) : (
          notices.map((n) => (
            <div
              key={n._id}
              className={`notice-item ${n.priority}`}
              style={{ opacity: isExpired(n.expiryDate) ? 0.5 : 1 }}
            >
              <div className="flex-between">
                <h3>
                  {n.title}
                  {isExpired(n.expiryDate) && (
                    <span className="badge" style={{ marginLeft: 8, background: "#e5e7eb", color: "#374151" }}>
                      Expired
                    </span>
                  )}
                </h3>
                <div className="flex gap-8">
                  <span className={`badge badge-${n.priority.toLowerCase()}`}>{n.priority}</span>
                  {isAdmin && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(n._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <p style={{ marginTop: 8 }}>{n.content}</p>

              <div className="notice-meta" style={{ marginTop: 10 }}>
                <span>Posted: {new Date(n.createdAt).toLocaleDateString()}</span>
                <span>⏰ Expires: {new Date(n.expiryDate).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
};

export default NoticesPage;
