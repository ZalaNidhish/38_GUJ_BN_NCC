import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const AttendancePage = () => {
  const { profile } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const { data } = await api.get("/attendance/my");
        setRecords(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  // Split records by category — skip orphaned records where event is null
  const paradeRecords = records.filter(
    (r) => r.event && r.event.eventCategory === "Parade"
  );
  const extraRecords = records.filter(
    (r) => r.event && r.event.eventCategory === "Other Event"
  );

  // Parade stats (live portal records)
  const paradeTotal   = paradeRecords.length;
  const paradePresent = paradeRecords.filter((r) => r.status === "Present").length;
  const paradeAbsent  = paradeTotal - paradePresent;
  const paradePct     = paradeTotal > 0 ? +((paradePresent / paradeTotal) * 100).toFixed(1) : 0;

  // Extra event stats
  const extraTotal   = extraRecords.length;
  const extraPresent = extraRecords.filter((r) => r.status === "Present").length;
  const extraAbsent  = extraTotal - extraPresent;
  const extraPct     = extraTotal > 0 ? +((extraPresent / extraTotal) * 100).toFixed(1) : 0;

  // Seeded (Excel) historical parade data
  const seededTotal   = profile?.totalParades   || 0;
  const seededPresent = profile?.paradesPresent || 0;
  const seededAbsent  = seededTotal - seededPresent;
  const seededPct     = profile?.attendancePct  || 0;

  // If no live parade records yet, use seeded official data
  const useSeeded = paradeTotal === 0 && seededTotal > 0;
  const displayParadeTotal   = useSeeded ? seededTotal   : paradeTotal;
  const displayParadePresent = useSeeded ? seededPresent : paradePresent;
  const displayParadeAbsent  = useSeeded ? seededAbsent  : paradeAbsent;
  const displayParadePct     = useSeeded ? seededPct     : paradePct;

  // Overall combined
  const combinedTotal   = displayParadeTotal + extraTotal;
  const combinedPresent = displayParadePresent + extraPresent;
  const combinedAbsent  = combinedTotal - combinedPresent;
  const combinedPct     = combinedTotal > 0 ? +((combinedPresent / combinedTotal) * 100).toFixed(1) : 0;

  const barColor = (pct) =>
    pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)";

  const StatStrip = ({ total, present, absent, pct }) => (
    <div style={{ marginBottom: 16 }}>
      <div className="stats-grid">
        <div className="stat-card"><h3>{total}</h3><p>Total</p></div>
        <div className="stat-card green"><h3>{present}</h3><p>Present</p></div>
        <div className="stat-card red"><h3>{absent}</h3><p>Absent</p></div>
        <div className="stat-card accent"><h3>{pct}%</h3><p>Rate</p></div>
      </div>
      {total > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ background: "var(--gray-mid)", borderRadius: 8, height: 10, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, background: barColor(pct), height: "100%", borderRadius: 8, transition: "width 0.5s ease" }} />
          </div>
          <p style={{ fontSize: 12, color: "var(--gray)", marginTop: 4 }}>
            {pct}% attendance{pct < 75 ? " — Below recommended 75%" : ""}
          </p>
        </div>
      )}
    </div>
  );

  const RecordsTable = ({ data, emptyMsg }) => (
    data.length === 0 ? (
      <p style={{ color: "var(--gray)", textAlign: "center", padding: "12px 0 0" }}>{emptyMsg}</p>
    ) : (
      <div className="table-wrap" style={{ marginTop: 8 }}>
        <table>
          <thead>
            <tr><th>#</th><th>Event</th><th>Type</th><th>Date</th><th>Status</th></tr>
          </thead>
          <tbody>
            {data.filter((r) => r.event).map((r, i) => (
              <tr key={r._id}>
                <td style={{ color: "var(--gray)" }}>{i + 1}</td>
                <td><strong>{r.event?.title || "—"}</strong></td>
                <td><span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 12, fontWeight: 600, background: r.event?.eventCategory === "Parade" ? "#e0f2fe" : "#f0fdf4", color: r.event?.eventCategory === "Parade" ? "#0369a1" : "#15803d" }}>{r.event?.eventCategory || "—"}</span></td>
                <td>{r.date ? new Date(r.date).toLocaleDateString() : (r.event?.startDate ? new Date(r.event.startDate).toLocaleDateString() : "—")}</td>
                <td>
                  <span className={`badge badge-${r.status?.toLowerCase()}`}>
                    {r.status === "Present" ? "✔ Present" : "✘ Absent"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>My Attendance</h1>
          <p>Parade and extra event participation records</p>
        </div>

        {/* ── Overall Combined ── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h2>📊 Overall Attendance</h2></div>
          <StatStrip total={combinedTotal} present={combinedPresent} absent={combinedAbsent} pct={combinedPct} />
        </div>

        {/* ── Parade Attendance ── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2>🎖 Parade Attendance</h2>
            {useSeeded && <span style={{ fontSize: 12, color: "var(--gray)" }}>(official records)</span>}
          </div>
          <StatStrip
            total={displayParadeTotal}
            present={displayParadePresent}
            absent={displayParadeAbsent}
            pct={displayParadePct}
          />
          {!useSeeded && (
            loading ? <p>Loading...</p> :
            <RecordsTable data={paradeRecords} emptyMsg="No parade records yet." />
          )}
        </div>

        {/* ── Extra Events Attendance ── */}
        <div className="card">
          <div className="card-header"><h2>📋 Extra Events Attendance</h2></div>
          <StatStrip total={extraTotal} present={extraPresent} absent={extraAbsent} pct={extraPct} />
          {loading ? <p>Loading...</p> :
            <RecordsTable data={extraRecords} emptyMsg="No extra event records yet." />
          }
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
