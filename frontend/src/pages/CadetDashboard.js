import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const StatCard = ({ value, label, color }) => (
  <div className={`stat-card ${color || ""}`}>
    <h3>{value}</h3>
    <p>{label}</p>
  </div>
);

const CadetDashboard = () => {
  const { user } = useAuth();
  const [notices, setNotices]     = useState([]);
  const [events, setEvents]       = useState([]);
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [noticeRes, eventRes, profileRes] = await Promise.allSettled([
          api.get("/notices"),
          api.get("/events/upcoming"),
          api.get("/cadet/profile"),
        ]);
        if (noticeRes.status === "fulfilled")  setNotices(noticeRes.value.data.slice(0, 3));
        if (eventRes.status === "fulfilled")   setEvents(eventRes.value.data.slice(0, 5));
        if (profileRes.status === "fulfilled") setProfile(profileRes.value.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const attendancePct   = profile?.attendancePct  || 0;
  const totalParades    = profile?.totalParades    || 0;
  const paradesPresent  = profile?.paradesPresent  || 0;

  const displayName = profile?.name || user?.regimentalNumber;
  const displayRank = profile?.rank ? `${profile.rank}` : "";

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header dashboard-header">
          <div className="dashboard-welcome">
            <span className="welcome-label">Welcome back,</span>
            <h1 className="welcome-name">
              {displayRank && <span className="rank-tag">{displayRank}</span>}
              {displayName}
            </h1>
            <p className="welcome-date">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div className="header-badge">
            <div className="cadet-avatar">
              {profile?.photo
                ? <img src={profile.photo} alt="Profile" />
                : <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              }
            </div>
          </div>
        </div>

        {user?.isDefaultPassword && (
          <div className="alert alert-warn">
            You are using your default password.{" "}
            <Link to="/change-password">Change it now for security</Link>.
          </div>
        )}

        <div className="stats-grid">
          <StatCard value={totalParades}   label="Total Parades"    color="" />
          <StatCard value={paradesPresent} label="Parades Present"  color="green" />
          <StatCard value={`${attendancePct}%`} label="Attendance Rate" color="accent" />
          <StatCard value={notices.length} label="Active Notices"   color="warn" />
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Recent Notices</h2>
            <Link to="/notices" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {loading ? <p className="loading-text">Loading notices...</p>
            : notices.length === 0
              ? <p className="empty-state">No active notices at this time.</p>
              : notices.map((n) => (
                <div key={n._id} className={`notice-item ${n.priority}`}>
                  <div className="flex-between">
                    <h3>{n.title}</h3>
                    <span className={`badge badge-${n.priority?.toLowerCase()}`}>{n.priority}</span>
                  </div>
                  <p>{n.content?.substring(0, 120)}{n.content?.length > 120 ? "..." : ""}</p>
                  <div className="notice-meta">
                    <span>Expires: {new Date(n.expiryDate).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
              ))
          }
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Upcoming Events</h2>
            <Link to="/events" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {loading ? <p className="loading-text">Loading events...</p>
            : events.length === 0
              ? <p className="empty-state">No upcoming events scheduled.</p>
              : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Event</th><th>Type</th><th>Date</th><th>Location</th></tr>
                    </thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e._id}>
                          <td><strong>{e.title}</strong></td>
                          <td><span className={`badge badge-${e.type?.toLowerCase()}`}>{e.type}</span></td>
                          <td>{new Date(e.startDate).toLocaleDateString("en-IN")}</td>
                          <td>{e.location || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          }
        </div>
      </div>
    </div>
  );
};

export default CadetDashboard;
