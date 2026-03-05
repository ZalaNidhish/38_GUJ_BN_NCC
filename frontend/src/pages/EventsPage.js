import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const EventsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({ type: "", text: "" });

  const emptyForm = {
    title: "", description: "",
    eventCategory: "Parade",
    startDate: "", endDate: "",
    location: "",
  };
  const [form, setForm] = useState(emptyForm);

  const isParade = form.eventCategory === "Parade";

  const fetchEvents = async () => {
    try {
      const { data } = await api.get("/events");
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // When switching to Parade, clear endDate — it's not needed
      if (name === "eventCategory" && value === "Parade") {
        updated.endDate = "";
      }
      return updated;
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isParade && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      setMsg({ type: "error", text: "End date cannot be before start date" });
      return;
    }
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      await api.post("/events", form);
      setMsg({ type: "success", text: "Event created successfully!" });
      setShowForm(false);
      setForm(emptyForm);
      fetchEvents();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to create event" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      setEvents(events.filter((e) => e._id !== id));
    } catch (err) {
      alert("Failed to delete event");
    }
  };

  const isUpcoming = (e) => new Date(e.endDate) >= new Date();

  /* ─── badge colours ─── */
  const catStyle = (cat) =>
    cat === "Parade"
      ? { background: "#e0f2fe", color: "#0369a1" }
      : { background: "#f0fdf4", color: "#15803d" };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">

        <div className="page-header flex-between">
          <div>
            <h1>Events & Camps</h1>
            <p>{isAdmin ? "Create and manage events, mark attendance" : "View NCC events and camps"}</p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setMsg({ type: "", text: "" }); }}>
              {showForm ? "Cancel" : "+ New Event"}
            </button>
          )}
        </div>

        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        {/* ── Create Event Form (admin only) ── */}
        {isAdmin && showForm && (
          <div className="card">
            <h2 style={{ marginBottom: 18 }}>Create New Event</h2>
            <form onSubmit={handleCreate}>

              {/* ── Step 1: Choose Parade or Other Event ── */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ fontWeight: 600, display: "block", marginBottom: 10 }}>
                  Event Category <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    { value: "Parade",      icon: "🎖️", desc: "Single day" },
                    { value: "Other Event", icon: "🏕️", desc: "Multi-day (Camp, Training, etc.)" },
                  ].map(({ value, icon, desc }) => (
                    <label
                      key={value}
                      style={{
                        display: "flex", flexDirection: "column", gap: 2,
                        cursor: "pointer", padding: "12px 20px", borderRadius: 10,
                        border: `2px solid ${form.eventCategory === value ? "var(--primary)" : "var(--gray-mid)"}`,
                        background: form.eventCategory === value ? "#e0f2fe" : "white",
                        minWidth: 170, transition: "all 0.15s",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 15 }}>
                        <input
                          type="radio"
                          name="eventCategory"
                          value={value}
                          checked={form.eventCategory === value}
                          onChange={handleChange}
                          style={{ accentColor: "var(--primary)", width: 16, height: 16 }}
                        />
                        {icon} {value}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--gray)", paddingLeft: 24 }}>{desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ── Title & Location ── */}
              <div className="form-row">
                <div className="form-group">
                  <label>Title <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Republic Day Parade" />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. NCC Ground, Ahmedabad" />
                </div>
              </div>

              {/* ── Description ── */}
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Optional details..." />
              </div>

              {/* ── Date fields — conditional on category ── */}
              <div className="form-row">
                {isParade ? (
                  /* Parade → single date picker */
                  <div className="form-group">
                    <label>Parade Date <span style={{ color: "var(--danger)" }}>*</span></label>
                    <input
                      type="date" name="startDate" value={form.startDate}
                      onChange={handleChange} required
                    />
                    <span style={{ fontSize: 12, color: "var(--gray)", marginTop: 4, display: "block" }}>
                      Attendance will be marked for this single day only.
                    </span>
                  </div>
                ) : (
                  /* Other Event → start + end date */
                  <>
                    <div className="form-group">
                      <label>Start Date <span style={{ color: "var(--danger)" }}>*</span></label>
                      <input
                        type="date" name="startDate" value={form.startDate}
                        onChange={handleChange} required
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date <span style={{ color: "var(--danger)" }}>*</span></label>
                      <input
                        type="date" name="endDate" value={form.endDate}
                        onChange={handleChange} required
                        min={form.startDate || undefined}
                      />
                    </div>
                  </>
                )}
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 4 }}>
                {saving ? <><span className="spinner" /> Creating...</> : "🗓️ Create Event"}
              </button>
            </form>
          </div>
        )}

        {/* ── Events Table ── */}
        <div className="card">
          {loading ? (
            <p>Loading events...</p>
          ) : events.length === 0 ? (
            <p style={{ color: "var(--gray)", textAlign: "center", padding: 20 }}>No events found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Status</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => {
                    const parade = e.eventCategory === "Parade";
                    const sameDay = e.startDate && e.endDate &&
                      new Date(e.startDate).toDateString() === new Date(e.endDate).toDateString();
                    return (
                      <tr key={e._id}>
                        <td>
                          <strong>{e.title}</strong>
                          {e.description && (
                            <p style={{ fontSize: 12, color: "var(--gray)", marginTop: 2 }}>
                              {e.description.substring(0, 60)}
                            </p>
                          )}
                        </td>
                        <td>
                          <span style={{
                            padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                            ...catStyle(e.eventCategory),
                          }}>
                            {e.eventCategory === "Parade" ? "🎖️ Parade" : "🏕️ Other Event"}
                          </span>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {parade || sameDay
                            ? new Date(e.startDate).toLocaleDateString()
                            : `${new Date(e.startDate).toLocaleDateString()} – ${new Date(e.endDate).toLocaleDateString()}`}
                        </td>
                        <td>{e.location || "—"}</td>
                        <td>
                          <span className="badge" style={{
                            background: isUpcoming(e) ? "#d1fae5" : "#f3f4f6",
                            color: isUpcoming(e) ? "#065f46" : "#6b7280",
                          }}>
                            {isUpcoming(e) ? "Upcoming" : "Completed"}
                          </span>
                        </td>
                        {isAdmin && (
                          <td>
                            <div className="flex gap-8">
                              <Link to={`/mark-attendance/${e._id}`} className="btn btn-gold btn-sm">
                                Attendance
                              </Link>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e._id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EventsPage;
