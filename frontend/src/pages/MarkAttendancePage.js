import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";

/* ─── helpers ─── */
const currentYear = new Date().getFullYear();

const getYear = (joiningYear) => {
  if (!joiningYear) return "—";
  const diff = currentYear - parseInt(joiningYear);
  if (diff <= 0) return "1st";
  if (diff === 1) return "2nd";
  if (diff === 2) return "3rd";
  return `${diff + 1}th`;
};

// Returns array of "YYYY-MM-DD" strings for every day between startDate and endDate (inclusive)
function buildDateRange(startDate, endDate) {
  const dates = [];
  const cur = new Date(startDate);
  cur.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

// "2025-02-14" → "Fri, 14 Feb"
function fmtDate(dateStr) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
}

// today as "YYYY-MM-DD"
const todayStr = () => new Date().toISOString().slice(0, 10);

/* ─── component ─── */
const MarkAttendancePage = () => {
  const { eventId } = useParams();
  const navigate    = useNavigate();

  const [event, setEvent]     = useState(null);
  const [cadets, setCadets]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState({ type: "", text: "" });
  const [search, setSearch]   = useState("");

  // all dates for this event (single element for Parade)
  const [dates, setDates]               = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  // attendance[dateStr][cadetId] = "Present" | "Absent"
  const [attendance, setAttendance] = useState({});

  /* ── load event + cadets + existing attendance ── */
  const fetchData = useCallback(async () => {
    try {
      const [eventRes, cadetRes, attRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get("/admin/cadets"),
        api.get(`/attendance/event/${eventId}`),
      ]);

      const ev     = eventRes.data;
      const cadetList = cadetRes.data;
      setEvent(ev);
      setCadets(cadetList);

      // Build full date range for this event
      const allDates = buildDateRange(ev.startDate, ev.endDate);
      setDates(allDates);

      // Default selected date: today if it falls in range, else first day
      const today = todayStr();
      const defaultDate = allDates.includes(today) ? today : allDates[0];
      setSelectedDate(defaultDate);

      // Pre-fill attendance map from existing records
      const initial = {};
      allDates.forEach((d) => {
        initial[d] = {};
        cadetList.forEach((c) => {
          initial[d][c.user?._id || c.user] = "Absent";
        });
      });

      attRes.data.records.forEach((r) => {
        const recDate  = new Date(r.date).toISOString().slice(0, 10);
        const cadetId  = r.cadet?._id || r.cadet;
        if (initial[recDate]) {
          initial[recDate][cadetId] = r.status;
        }
      });

      setAttendance(initial);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── derived state ── */
  const today          = todayStr();
  const isFutureEvent  = event && new Date(event.startDate).toISOString().slice(0, 10) > today;
  const isFutureDate   = selectedDate > today;
  const isParade       = event?.eventCategory === "Parade";
  const currentDayAtt  = attendance[selectedDate] || {};
  const presentCount   = Object.values(currentDayAtt).filter((s) => s === "Present").length;

  /* ── actions ── */
  const toggle = (uid) => {
    if (isFutureDate || isFutureEvent) return;
    setAttendance((prev) => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        [uid]: prev[selectedDate]?.[uid] === "Present" ? "Absent" : "Present",
      },
    }));
  };

  const markAll = (status) => {
    const updated = {};
    cadets.forEach((c) => { updated[c.user?._id || c.user] = status; });
    setAttendance((prev) => ({ ...prev, [selectedDate]: updated }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const dayAtt = attendance[selectedDate] || {};
      await api.post("/attendance/mark", {
        eventId,
        date: selectedDate,
        attendance: Object.entries(dayAtt).map(([cadetId, status]) => ({ cadetId, status })),
      });
      setMsg({ type: "success", text: `✔ Attendance saved for ${fmtDate(selectedDate)}` });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to save attendance" });
    } finally {
      setSaving(false);
    }
  };

  const filteredCadets = cadets.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.regimentalNumber?.toLowerCase().includes(q) ||
      getYear(c.joiningYear).toLowerCase().includes(q)
    );
  });

  /* ── loading state ── */
  if (loading) return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content"><p>Loading...</p></div>
    </div>
  );

  /* ── badge for date tabs ── */
  const dayIsSaved = (d) => {
    const dayAtt = attendance[d] || {};
    return Object.values(dayAtt).some((s) => s === "Present");
  };

  /* ─────────────── render ─────────────── */
  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">

        {/* ── Page header ── */}
        <div className="page-header flex-between">
          <div>
            <h1>Mark Attendance</h1>
            {event && (
              <p style={{ marginTop: 4 }}>
                <strong>{event.title}</strong>
                {event.location ? ` @ ${event.location}` : ""}
                <span style={{
                  marginLeft: 10, padding: "2px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: isParade ? "#e0f2fe" : "#f0fdf4",
                  color:      isParade ? "#0369a1" : "#15803d",
                }}>
                  {isParade ? "🎖️ Parade" : "🏕️ Other Event"}
                </span>
                <span style={{ marginLeft: 10, fontSize: 13, color: "var(--gray)" }}>
                  {isParade
                    ? fmtDate(new Date(event.startDate).toISOString().slice(0, 10))
                    : `${fmtDate(new Date(event.startDate).toISOString().slice(0, 10))} → ${fmtDate(new Date(event.endDate).toISOString().slice(0, 10))}`}
                </span>
              </p>
            )}
          </div>
          <button className="btn btn-ghost" onClick={() => navigate("/attendance")}>← Back</button>
        </div>

        {/* ── Alerts ── */}
        {isFutureEvent && (
          <div className="alert alert-warn">
            This event hasn't started yet. Attendance cannot be marked for future events.
          </div>
        )}
        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        {/* ── Date tabs (only for Other Event with >1 day) ── */}
        {!isParade && dates.length > 1 && (
          <div className="card" style={{ marginBottom: 16, padding: "16px 20px" }}>
            <p style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>
              📅 Select Day to Mark Attendance
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {dates.map((d) => {
                const isSelected = d === selectedDate;
                const isPast     = d <= today;
                const saved      = dayIsSaved(d);
                return (
                  <button
                    key={d}
                    onClick={() => { setSelectedDate(d); setMsg({ type: "", text: "" }); }}
                    style={{
                      position: "relative",
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: `2px solid ${isSelected ? "var(--primary)" : "var(--gray-mid)"}`,
                      background: isSelected
                        ? "var(--primary)"
                        : isPast ? "#f8fafc" : "#f3f4f6",
                      color: isSelected ? "white" : isPast ? "var(--dark)" : "var(--gray)",
                      fontWeight: isSelected ? 700 : 400,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    {fmtDate(d)}
                    {/* green dot for days that already have attendance saved */}
                    {saved && !isSelected && (
                      <span style={{
                        position: "absolute", top: -5, right: -5,
                        background: "#22c55e", color: "white",
                        borderRadius: "50%", width: 16, height: 16,
                        fontSize: 10, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                      }}>✔</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: "var(--gray)", marginTop: 8 }}>
              🟢 = attendance already saved for that day
            </p>
          </div>
        )}

        {/* ── Attendance card ── */}
        <div className="card">

          {/* Header row */}
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, marginRight: 4 }}>
                {isParade ? "📅" : "📋"} {fmtDate(selectedDate)}
              </span>
              <span style={{ fontWeight: 600, color: "var(--primary)", marginLeft: 8 }}>
                {presentCount} / {cadets.length} Present
              </span>
              <span style={{ color: "var(--gray)", marginLeft: 6, fontSize: 13 }}>
                ({cadets.length > 0 ? Math.round((presentCount / cadets.length) * 100) : 0}%)
              </span>
            </div>
            {!isFutureDate && !isFutureEvent && (
              <div className="flex gap-8">
                <button className="btn btn-sm btn-success" onClick={() => markAll("Present")}>✔ All Present</button>
                <button className="btn btn-sm btn-ghost"   onClick={() => markAll("Absent")}>✘ All Absent</button>
              </div>
            )}
          </div>

          {/* Future date warning */}
          {isFutureDate && !isFutureEvent && (
            <div className="alert alert-warn" style={{ marginBottom: 12 }}>
              This day is in the future — select a past date to mark attendance.
            </div>
          )}

          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Search by name, reg. no., year..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "8px 14px", border: "1.5px solid var(--gray-mid)", borderRadius: 8, fontSize: 14, width: "100%", maxWidth: 340 }}
            />
          </div>

          {/* Cadet table */}
          {filteredCadets.length === 0 ? (
            <p style={{ color: "var(--gray)" }}>No cadets match the search.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Attendance</th>
                    <th>Name</th>
                    <th>Regimental No.</th>
                    <th>Year</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCadets.map((cadet) => {
                    const uid      = cadet.user?._id || cadet.user;
                    const rowKey   = cadet._id || uid || cadet.regimentalNumber;
                    const status   = currentDayAtt[uid] || "Absent";
                    const disabled = isFutureDate || isFutureEvent;
                    return (
                      <tr key={rowKey}>
                        <td>
                          <button
                            onClick={() => toggle(uid)}
                            disabled={disabled}
                            className="btn btn-sm"
                            style={{
                              background: status === "Present" ? "var(--success)" : "var(--gray-light)",
                              color:      status === "Present" ? "white" : "var(--gray)",
                              minWidth: 110,
                              cursor: disabled ? "not-allowed" : "pointer",
                            }}
                          >
                            {status === "Present" ? "✔ Present" : "✘ Absent"}
                          </button>
                        </td>
                        <td><strong>{cadet.name}</strong></td>
                        <td>
                          <code style={{ background: "var(--gray-light)", padding: "2px 8px", borderRadius: 4 }}>
                            {cadet.regimentalNumber}
                          </code>
                        </td>
                        <td>{getYear(cadet.joiningYear)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Save button */}
          {cadets.length > 0 && !isFutureDate && !isFutureEvent && (
            <div className="mt-16">
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={saving}
                style={{ minWidth: 200 }}
              >
                {saving
                  ? <><span className="spinner" /> Saving...</>
                  : `💾 Save Attendance — ${fmtDate(selectedDate)}`}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MarkAttendancePage;
