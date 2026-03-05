import React from "react";
import Sidebar from "../components/Sidebar";

const DeveloperPage = () => {
  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Developer Information</h1>
          <p>About this portal and its development</p>
        </div>

        <div className="card" style={{ maxWidth: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 32, fontWeight: 700, flexShrink: 0
            }}>
              💻
            </div>
            <div>
              <h2 style={{ color: "var(--primary)", fontSize: 22, marginBottom: 4 }}>NCC Cadet Portal</h2>
              <p style={{ color: "var(--gray)", fontSize: 14 }}>
                A full-stack web application for managing NCC cadets, attendance, events and notices.
              </p>
            </div>
          </div>

          {/* Developer Info */}
          <div style={{ borderTop: "1px solid var(--gray-mid)", paddingTop: 20, marginBottom: 20 }}>
            <h3 style={{ color: "var(--primary)", marginBottom: 16, fontSize: 16 }}>Developed By</h3>

            <div style={{
              background: "linear-gradient(135deg, #f0f7ff, #e8f4fd)",
              border: "1px solid var(--accent-light)",
              borderRadius: 12, padding: 20
            }}>
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Name</p>
                <p style={{ fontWeight: 700, fontSize: 20, color: "var(--primary)" }}>CDT Nidhish Zala</p>
              </div>

              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Education</p>
                <p style={{ fontWeight: 500, fontSize: 14 }}>BVM Engineering College &mdash; FY, Computer Engineering</p>
              </div>

              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Phone</p>
                <a href="tel:+919016325239" style={{ fontWeight: 500, fontSize: 14, color: "var(--accent)", textDecoration: "none" }}>
                  +91 9016325239
                </a>
              </div>

              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Email</p>
                <a href="mailto:nidhish1132007@gmail.com" style={{ fontWeight: 500, fontSize: 14, color: "var(--accent)", textDecoration: "none" }}>
                  nidhish1132007@gmail.com
                </a>
              </div>

              {/* Social Links */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="https://github.com/ZalaNidhish" target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "#24292e", color: "#fff",
                    padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                    textDecoration: "none", transition: "opacity 0.2s"
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  ZalaNidhish
                </a>

                <a href="https://www.linkedin.com/in/nidhish-zala" target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "#0077b5", color: "#fff",
                    padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                    textDecoration: "none", transition: "opacity 0.2s"
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  Nidhish Zala
                </a>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div style={{ borderTop: "1px solid var(--gray-mid)", paddingTop: 20, marginBottom: 20 }}>
            <h3 style={{ color: "var(--primary)", marginBottom: 14, fontSize: 16 }}>Tech Stack</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "React.js", color: "#0ea5e9", bg: "#e0f2fe" },
                { label: "Node.js", color: "#16a34a", bg: "#dcfce7" },
                { label: "Express.js", color: "#374151", bg: "#f3f4f6" },
                { label: "MongoDB", color: "#15803d", bg: "#dcfce7" },
                { label: "Mongoose", color: "#b91c1c", bg: "#fee2e2" },
                { label: "JWT Auth",   color: "#7c3aed", bg: "#ede9fe" },
                { label: "XLSX",       color: "#065f46", bg: "#d1fae5" },
                { label: "Cloudinary", color: "#1d4ed8", bg: "#dbeafe" },
              ].map(({ label, color, bg }) => (
                <span key={label} style={{
                  background: bg, color,
                  border: `1px solid ${color}33`,
                  padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500
                }}>{label}</span>
              ))}
            </div>
          </div>

          {/* Features */}
          <div style={{ borderTop: "1px solid var(--gray-mid)", paddingTop: 20, marginBottom: 20 }}>
            <h3 style={{ color: "var(--primary)", marginBottom: 14, fontSize: 16 }}>Features</h3>
            <ul style={{ paddingLeft: 0, listStyle: "none" }}>
              {[
                "Excel-based one-time database seeding for cadet data",
                "Role-based access — Admin and Cadet dashboards",
                "Cadet name, rank and battalion shown across all pages after login",
                "Attendance tracking per event with percentage calculation",
                "Notices and Events management for admin",
                "Full CRUD for cadet management (admin)",
                "Change password on first login enforcement",
                "Cloudinary integration for profile photo uploads",
                "Responsive design — works on mobile and desktop",
              ].map((feat) => (
                <li key={feat} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, color: "var(--text-light)", fontSize: 14 }}>
                  <span style={{ color: "var(--success)", marginTop: 2, flexShrink: 0 }}>✓</span>
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer badge */}
          <div style={{ borderTop: "1px solid var(--gray-mid)", paddingTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, flexShrink: 0 }}>
              <svg viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" fill="rgba(30,58,95,0.08)" stroke="#1e3a5f" strokeWidth="2"/>
                <polygon points="32,10 37,25 52,25 40,34 44,50 32,41 20,50 24,34 12,25 27,25" fill="#1e3a5f" opacity="0.85"/>
              </svg>
            </div>
            <p style={{ fontSize: 13, color: "var(--gray)" }}>
              Built for <strong style={{ color: "var(--primary)" }}>National Cadet Corps (NCC)</strong> &mdash; Unity and Discipline &mdash; 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPage;
