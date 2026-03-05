import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Icons = {
  dashboard:  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2"/></svg>,
  profile:    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  notices:    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
  events:     <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  attendance: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  cadets:     <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  pastAtt:    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  password:   <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>,
  developer:  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>,
  logout:     <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>,
  menu:       <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>,
  close:      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
};

const NCCEmblemSmall = () => (
  <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.08)" stroke="#c8a951" strokeWidth="2"/>
    <polygon points="32,10 37,25 52,25 40,34 44,50 32,41 20,50 24,34 12,25 27,25" fill="#c8a951" opacity="0.85"/>
  </svg>
);

const Sidebar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const isAdmin = user?.role === "admin";

  // Display name from profile (fetched from DB using regimental number after login)
  const displayName = isAdmin
    ? (profile?.name || user?.regimentalNumber || "Administrator")
    : (profile?.name || user?.regimentalNumber || "");

  // Display rank/role beneath name  
  const displaySubtitle = isAdmin
    ? (profile?.rank ? `${profile.rank} · Admin` : "Administrator")
    : (profile?.rank || "Cadet");

  const commonLinks = [
    { to: "/dashboard",  label: "Dashboard",  icon: Icons.dashboard },
    { to: "/profile",    label: "My Profile",  icon: Icons.profile },
    { to: "/notices",    label: "Notices",     icon: Icons.notices },
    { to: "/events",     label: "Events",      icon: Icons.events },
    { to: "/attendance", label: "Attendance",  icon: Icons.attendance },
  ];

  const adminLinks = [
    { to: "/cadets", label: "All Cadets", icon: Icons.cadets },
  ];

  return (
    <>
      <button className="hamburger" onClick={() => setOpen(!open)} aria-label="Toggle menu">
        {open ? Icons.close : Icons.menu}
      </button>
      <div className={`sidebar-overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)} />

      <div className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-logo">
          <NCCEmblemSmall />
          <h2>NCC PORTAL</h2>
          <p>{isAdmin ? "Admin Panel" : "Cadet Portal"}</p>
        </div>

        {/* Profile mini-card in sidebar */}
        {profile && (
          <div style={{
            padding: "12px 16px",
            background: "rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", gap: 10
          }}>
            {profile.photo
              ? <img src={profile.photo} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }} />
              : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.7)">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
            }
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {displayName}
              </div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>{displaySubtitle}</div>
            </div>
          </div>
        )}

        <nav>
          {commonLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? "active" : "")}>
              <span className="nav-icon">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="nav-section-label">Admin</div>
              {adminLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? "active" : "")}>
                  <span className="nav-icon">{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </>
          )}

          <div className="nav-section-label">Account</div>
          <NavLink to="/change-password" className={({ isActive }) => (isActive ? "active" : "")}>
            <span className="nav-icon">{Icons.password}</span>
            <span>Change Password</span>
          </NavLink>

          <NavLink to="/developer" className={({ isActive }) => (isActive ? "active" : "")}>
            <span className="nav-icon">{Icons.developer}</span>
            <span>Developer Info</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="btn btn-ghost btn-sm sidebar-logout" onClick={handleLogout}>
            <span>{Icons.logout}</span> Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
