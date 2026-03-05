import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [notices, setNotices]   = useState([]);
  const [events, setEvents]     = useState([]);
  const [cadets, setCadets]     = useState([]);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [noticeRes, eventRes, cadetRes, profileRes] = await Promise.allSettled([
          api.get("/notices"),
          api.get("/events"),
          api.get("/admin/cadets"),
          api.get("/admin/profile"),
        ]);
        if (noticeRes.status === "fulfilled") setNotices(noticeRes.value.data);
        if (eventRes.status === "fulfilled")  setEvents(eventRes.value.data);
        if (cadetRes.status === "fulfilled")  setCadets(cadetRes.value.data);
        if (profileRes.status === "fulfilled") setProfile(profileRes.value.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const upcomingEvents = events.filter((e) => new Date(e.endDate) >= new Date());
  const today = new Date();
  const todayEvents = events.filter((e) => {
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    return start <= today && end >= today;
  });

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome, {profile?.name || user?.regimentalNumber} — {profile?.rank || "Administrator"}</p>
        </div>

        {user?.isDefaultPassword && (
          <div className="alert alert-warn">
            You're using the default password. <Link to="/change-password">Change it now</Link>.
          </div>
        )}

        {!profile && !loading && (
          <div className="alert alert-info">
            Your admin profile is not set up. <Link to="/profile">Create Profile →</Link>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{cadets.length}</h3>
            <p>Total Cadets</p>
          </div>
          <div className="stat-card accent">
            <h3>{upcomingEvents.length}</h3>
            <p>Upcoming Events</p>
          </div>
          <div className="stat-card warn">
            <h3>{notices.length}</h3>
            <p>Active Notices</p>
          </div>
          <div className="stat-card green">
            <h3>{todayEvents.length}</h3>
            <p>Today's Events</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
            <Link to="/events" className="btn btn-primary">Create Event</Link>
            <Link to="/notices" className="btn btn-accent">Create Notice</Link>
            <Link to="/cadets" className="btn btn-ghost">View All Cadets</Link>
          </div>
        </div>

        {/* Recent Events */}
        <div className="card">
          <div className="card-header">
            <h2>Recent Events</h2>
            <Link to="/events" className="btn btn-ghost btn-sm">Manage All →</Link>
          </div>
          {loading ? <p>Loading...</p> : events.length === 0 ? (
            <p style={{ color: "var(--gray)" }}>No events yet. <Link to="/events">Create one</Link>.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Event</th><th>Type</th><th>Start</th><th>End</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {events.slice(0, 5).map((e) => (
                    <tr key={e._id}>
                      <td><strong>{e.title}</strong></td>
                      <td><span className={`badge badge-${e.type?.toLowerCase()}`}>{e.type}</span></td>
                      <td>{new Date(e.startDate).toLocaleDateString()}</td>
                      <td>{new Date(e.endDate).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/mark-attendance/${e._id}`} className="btn btn-accent btn-sm">
                          Mark Attendance
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Notices */}
        <div className="card">
          <div className="card-header">
            <h2>Active Notices</h2>
            <Link to="/notices" className="btn btn-ghost btn-sm">Manage All →</Link>
          </div>
          {loading ? <p>Loading...</p> : notices.length === 0 ? (
            <p style={{ color: "var(--gray)" }}>No notices.</p>
          ) : notices.slice(0, 3).map((n) => (
            <div key={n._id} className={`notice-item ${n.priority}`}>
              <div className="flex-between">
                <h3>{n.title}</h3>
                <span className={`badge badge-${n.priority?.toLowerCase()}`}>{n.priority}</span>
              </div>
              <div className="notice-meta">
                <span>Expires: {new Date(n.expiryDate).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
