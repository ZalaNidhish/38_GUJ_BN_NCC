import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";

const AdminAttendancePage = () => {
  const navigate = useNavigate();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Get ALL events (not just past), so admin can see upcoming too
        const { data } = await api.get("/events");
        // Also get attendance counts for past events
        const { data: pastData } = await api.get("/attendance/all-events");
        const pastMap = {};
        pastData.forEach((e) => { pastMap[e._id] = e; });

        const merged = data.map((ev) => ({
          ...ev,
          attendanceMarked: pastMap[ev._id]?.attendanceMarked || false,
          presentCount:     pastMap[ev._id]?.presentCount     || 0,
          totalMarked:      pastMap[ev._id]?.totalMarked      || 0,
        }));
        // Sort: upcoming first, then by date desc
        merged.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        setEvents(merged);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = events.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.title?.toLowerCase().includes(q) ||
      e.type?.toLowerCase().includes(q) ||
      e.eventCategory?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q)
    );
  });

  const upcomingEvents = filtered.filter((e) => new Date(e.startDate) >= today);
  const pastEvents     = filtered.filter((e) => new Date(e.startDate) < today);

  const totalEvents   = events.length;
  const markedEvents  = events.filter((e) => e.attendanceMarked).length;
  const pendingEvents = pastEvents.filter((e) => !e.attendanceMarked).length;

  const EventRow = ({ e, i }) => {
    const isPast   = new Date(e.startDate) < today;
    const isFuture = new Date(e.startDate) > today;
    const pct = e.totalMarked > 0 ? Math.round((e.presentCount / e.totalMarked) * 100) : null;
    return (
      <tr>
        <td style={{ color: "var(--gray)" }}>{i + 1}</td>
        <td>
          <strong>{e.title}</strong>
          {e.eventCategory && (
            <span style={{
              marginLeft: 8, padding: "1px 7px", borderRadius: 5, fontSize: 11, fontWeight: 600,
              background: e.eventCategory === "Parade" ? "#e0f2fe" : "#f0fdf4",
              color: e.eventCategory === "Parade" ? "#0369a1" : "#15803d"
            }}>
              {e.eventCategory}
            </span>
          )}
        </td>
        <td><span className={`badge badge-${e.type?.toLowerCase()}`}>{e.type}</span></td>
        <td>{new Date(e.startDate).toLocaleDateString()}{e.endDate && e.endDate !== e.startDate ? ` – ${new Date(e.endDate).toLocaleDateString()}` : ""}</td>
        <td>{e.location || "—"}</td>
        <td>
          {isFuture ? (
            <span style={{ color: "var(--gray)", fontSize: 13 }}>Upcoming</span>
          ) : e.attendanceMarked ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="badge badge-present">{e.presentCount}/{e.totalMarked}</span>
              {pct !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 60, height: 6, background: "var(--gray-mid)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4,
                      background: pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)" }} />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--gray)" }}>{pct}%</span>
                </div>
              )}
            </div>
          ) : (
            <span className="badge badge-absent">Not Marked</span>
          )}
        </td>
        <td>
          {isFuture ? (
            <span style={{ fontSize: 12, color: "var(--gray)", fontStyle: "italic" }}>—</span>
          ) : (
            <button
              className={`btn btn-sm ${e.attendanceMarked ? "btn-ghost" : "btn-primary"}`}
              onClick={() => navigate(`/mark-attendance/${e._id}`)}
            >
              {e.attendanceMarked ? "✏️ Update" : "✔ Mark"}
            </button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Attendance</h1>
          <p>Mark and manage attendance for all events</p>
        </div>

        {/* Summary stats */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <h3>{totalEvents}</h3>
            <p>Total Events</p>
          </div>
          <div className="stat-card green">
            <h3>{markedEvents}</h3>
            <p>Marked</p>
          </div>
          <div className="stat-card red">
            <h3>{pendingEvents}</h3>
            <p>Pending (Past)</p>
          </div>
          <div className="stat-card accent">
            <h3>{upcomingEvents.length}</h3>
            <p>Upcoming</p>
          </div>
        </div>

        {/* Events table */}
        <div className="card">
          <div className="card-header">
            <h2>All Events</h2>
            <input
              type="text"
              placeholder="Search by title, type, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "8px 14px", border: "1.5px solid var(--gray-mid)", borderRadius: 8, fontSize: 14, width: 260 }}
            />
          </div>

          {loading ? (
            <p>Loading events...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: "var(--gray)", textAlign: "center", padding: 24 }}>No events found.</p>
          ) : (
            <>
              {/* Upcoming events */}
              {upcomingEvents.length > 0 && (
                <>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Upcoming Events
                  </p>
                  <div className="table-wrap" style={{ marginBottom: 24 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>#</th><th>Event</th><th>Type</th><th>Date</th><th>Location</th><th>Attendance</th><th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingEvents.map((e, i) => <EventRow key={e._id} e={e} i={i} />)}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Past events */}
              {pastEvents.length > 0 && (
                <>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Past Events
                  </p>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th><th>Event</th><th>Type</th><th>Date</th><th>Location</th><th>Attendance</th><th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pastEvents.map((e, i) => <EventRow key={e._id} e={e} i={i} />)}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAttendancePage;
