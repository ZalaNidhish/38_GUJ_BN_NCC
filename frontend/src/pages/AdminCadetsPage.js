import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";

const currentYear = new Date().getFullYear();

const getYear = (joiningYear) => {
  if (!joiningYear) return "—";
  const diff = currentYear - parseInt(joiningYear);
  if (diff <= 0) return "1st";
  if (diff === 1) return "2nd";
  if (diff === 2) return "3rd";
  return `${diff + 1}th`;
};

const PctBadge = ({ pct }) => {
  const num = parseFloat(pct) || 0;
  const bg =
    num >= 75 ? "#dcfce7" : num >= 50 ? "#fef9c3" : "#fee2e2";
  const color =
    num >= 75 ? "#15803d" : num >= 50 ? "#92400e" : "#dc2626";
  return (
    <span style={{ background: bg, color, fontWeight: 600, fontSize: 13, padding: "2px 8px", borderRadius: 6 }}>
      {num}%
    </span>
  );
};

const AdminCadetsPage = () => {
  const [cadets, setCadets]                   = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCadet, setSelectedCadet]     = useState(null);
  const [summary, setSummary]                 = useState(null);
  const [summaryLoading, setSummaryLoading]   = useState(false);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [editCadet, setEditCadet]             = useState(null);
  const [deleteConfirm, setDeleteConfirm]     = useState(null);
  const [actionMsg, setActionMsg]             = useState({ type: "", text: "" });
  const [addForm, setAddForm] = useState({
    regimentalNumber: "", name: "", rank: "", wing: "Army",
    battalion: "", phone: "", gender: "", joiningYear: "", address: ""
  });
  const [addLoading, setAddLoading] = useState(false);

  // Per-cadet live attendance cache (fetched in background)
  const [liveAttendance, setLiveAttendance] = useState({});

  const loadCadets = async () => {
    try {
      const { data } = await api.get("/admin/cadets");
      setCadets(data);
      // fetch live attendance for all cadets in background
      data.forEach(async (c) => {
        try {
          const uid = c.user?._id || c.user;
          if (!uid) return;
          const { data: s } = await api.get(`/attendance/summary/${uid}`);
          setLiveAttendance((prev) => ({ ...prev, [uid]: s }));
        } catch (_) {}
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCadets(); }, []);

  const openCadet = async (cadet) => {
    setSelectedCadet(cadet);
    setSummary(null);
    setSummaryLoading(true);
    try {
      const uid = cadet.user?._id || cadet.user;
      const { data } = await api.get(`/attendance/summary/${uid}`);
      setSummary(data);
    } catch (err) { console.error(err); }
    finally { setSummaryLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setActionMsg({ type: "", text: "" });
    try {
      await api.post("/admin/register-cadet", addForm);
      setActionMsg({ type: "success", text: "Cadet registered successfully!" });
      setShowAddModal(false);
      setAddForm({ regimentalNumber: "", name: "", rank: "", wing: "Army", battalion: "", phone: "", gender: "", joiningYear: "", address: "" });
      loadCadets();
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.message || "Failed to register cadet." });
    } finally { setAddLoading(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setActionMsg({ type: "", text: "" });
    try {
      const uid = editCadet.user?._id || editCadet.user;
      await api.put(`/admin/cadets/${uid}`, editCadet);
      setActionMsg({ type: "success", text: "Cadet updated successfully!" });
      setEditCadet(null);
      loadCadets();
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.message || "Failed to update cadet." });
    } finally { setAddLoading(false); }
  };

  const handleDelete = async (cadet) => {
    const uid = cadet.user?._id || cadet.user;
    try {
      await api.delete(`/admin/cadets/${uid}`);
      setActionMsg({ type: "success", text: `Cadet ${cadet.regimentalNumber} deleted.` });
      setDeleteConfirm(null);
      loadCadets();
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.message || "Failed to delete cadet." });
    }
  };

  const filtered = cadets.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.regimentalNumber?.toLowerCase().includes(q) ||
      c.rank?.toLowerCase().includes(q) ||
      getYear(c.joiningYear).toLowerCase().includes(q)
    );
  });

  const ModalOverlay = ({ children, onClose }) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 14, padding: 28, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {children}
      </div>
    </div>
  );

  const CadetForm = ({ data, onChange, onSubmit, onCancel, loading: fLoading, title }) => (
    <form onSubmit={onSubmit}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: "var(--primary)", fontSize: 18 }}>{title}</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>✕ Close</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          ["Regimental Number *", "regimentalNumber", "text", title.includes("Add")],
          ["Full Name", "name", "text", false],
          ["Rank", "rank", "text", false],
          ["Phone", "phone", "tel", false],
          ["Battalion", "battalion", "text", false],
          ["Joining Year", "joiningYear", "number", false],
        ].map(([label, field, type, required]) => (
          <div key={field} className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 12 }}>{label}</label>
            <input type={type} value={data[field] || ""} required={required}
              readOnly={field === "regimentalNumber" && !title.includes("Add")}
              style={field === "regimentalNumber" && !title.includes("Add") ? { background: "#f1f5f9", cursor: "not-allowed" } : {}}
              onChange={(e) => onChange({ ...data, [field]: e.target.value })} />
          </div>
        ))}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 12 }}>Wing</label>
          <select value={data.wing || "Army"} onChange={(e) => onChange({ ...data, wing: e.target.value })}>
            <option>Army</option><option>Navy</option><option>Air Force</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 12 }}>Gender</label>
          <select value={data.gender || ""} onChange={(e) => onChange({ ...data, gender: e.target.value })}>
            <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
      </div>
      <div className="form-group" style={{ marginTop: 14 }}>
        <label style={{ fontSize: 12 }}>Address</label>
        <textarea value={data.address || ""} rows={2} onChange={(e) => onChange({ ...data, address: e.target.value })} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button type="submit" className="btn btn-primary" disabled={fLoading}>
          {fLoading ? "Saving..." : title.includes("Add") ? "Register Cadet" : "Save Changes"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1>Cadets</h1>
            <p>All registered cadets ({cadets.length} total)</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add Cadet</button>
        </div>

        {actionMsg.text && (
          <div className={`alert alert-${actionMsg.type}`} style={{ marginBottom: 16 }}>
            {actionMsg.text}
            <button style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
              onClick={() => setActionMsg({ type: "", text: "" })}>×</button>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2>Cadet Registry</h2>
          </div>

          {/* Single search filter */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Search by name, reg. no., rank, year..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "8px 14px", border: "1.5px solid var(--gray-mid)", borderRadius: 8, fontSize: 14, width: "100%", maxWidth: 360 }}
            />
          </div>

          {loading ? <p>Loading cadets...</p> : filtered.length === 0 ? (
            <p style={{ color: "var(--gray)", textAlign: "center", padding: 24 }}>No cadets found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Reg. Number</th>
                    <th>Rank</th>
                    <th>Year</th>
                    <th>Parade Att%</th>
                    <th>Total Att%</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const uid = c.user?._id || c.user;
                    const live = liveAttendance[uid];
                    // Parade %: prefer live portal data, fallback to seeded
                    const paradePct = live
                      ? live.paradePct
                      : (c.attendancePct || 0);
                    // Total %: live total (parade + extra)
                    const totalPct = live ? live.percentage : (c.attendancePct || 0);
                    return (
                      <tr key={c.regimentalNumber}>
                        <td style={{ color: "var(--gray)" }}>{i + 1}</td>
                        <td><strong>{c.name || "—"}</strong></td>
                        <td><code style={{ background: "var(--gray-light)", padding: "2px 8px", borderRadius: 4 }}>{c.regimentalNumber}</code></td>
                        <td>{c.rank || "—"}</td>
                        <td>{getYear(c.joiningYear)}</td>
                        <td><PctBadge pct={paradePct} /></td>
                        <td><PctBadge pct={totalPct} /></td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-sm btn-primary" onClick={() => openCadet(c)} title="View Details">📊</button>
                            <button className="btn btn-sm btn-accent" onClick={() => setEditCadet({ ...c })} title="Edit">✏️</button>
                            <button className="btn btn-sm" style={{ background: "#fee2e2", color: "#dc2626", border: "none" }}
                              onClick={() => setDeleteConfirm(c)} title="Delete">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Cadet Modal */}
        {showAddModal && (
          <ModalOverlay onClose={() => setShowAddModal(false)}>
            <CadetForm data={addForm} onChange={setAddForm} onSubmit={handleAdd}
              onCancel={() => setShowAddModal(false)} loading={addLoading} title="Add New Cadet" />
          </ModalOverlay>
        )}

        {/* Edit Cadet Modal */}
        {editCadet && (
          <ModalOverlay onClose={() => setEditCadet(null)}>
            <CadetForm data={editCadet} onChange={setEditCadet} onSubmit={handleEdit}
              onCancel={() => setEditCadet(null)} loading={addLoading} title="Edit Cadet" />
          </ModalOverlay>
        )}

        {/* Delete Confirm Modal */}
        {deleteConfirm && (
          <ModalOverlay onClose={() => setDeleteConfirm(null)}>
            <div>
              <h2 style={{ color: "#dc2626", marginBottom: 12 }}>Confirm Delete</h2>
              <p style={{ marginBottom: 20 }}>
                Are you sure you want to permanently delete cadet <strong>{deleteConfirm.name} ({deleteConfirm.regimentalNumber})</strong>?
                This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" style={{ background: "#dc2626", color: "white" }}
                  onClick={() => handleDelete(deleteConfirm)}>Yes, Delete</button>
                <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              </div>
            </div>
          </ModalOverlay>
        )}

        {/* Detail Modal */}
        {selectedCadet && (
          <ModalOverlay onClose={() => { setSelectedCadet(null); setSummary(null); }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <h2 style={{ color: "var(--primary)", fontSize: 18 }}>Cadet Details</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedCadet(null); setSummary(null); }}>✕ Close</button>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{selectedCadet.name}</div>
                <div style={{ color: "var(--gray)", fontSize: 13 }}>{selectedCadet.regimentalNumber}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                {[
                  ["Rank", selectedCadet.rank],
                  ["Year", getYear(selectedCadet.joiningYear)],
                  ["Wing", selectedCadet.wing],
                  ["Battalion", selectedCadet.battalion],
                  ["Gender", selectedCadet.gender],
                  ["Phone", selectedCadet.phone],
                  ["Joining Year", selectedCadet.joiningYear],
                  ["Date of Birth", selectedCadet.dateOfBirth ? new Date(selectedCadet.dateOfBirth).toLocaleDateString() : null],
                  ["Address", selectedCadet.address],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>{label}</p>
                    <p style={{ fontWeight: 500, fontSize: 14 }}>{value || "—"}</p>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid var(--gray-mid)", paddingTop: 16 }}>
                <h3 style={{ marginBottom: 12, color: "var(--primary)", fontSize: 15 }}>Attendance Summary</h3>
                {summaryLoading ? <p>Loading...</p> : summary ? (
                  <>
                    {/* Parade Attendance */}
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gray)", textTransform: "uppercase", marginBottom: 6 }}>🎖 Parade Attendance</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                      {[
                        ["Total", summary.paradeTotal, ""],
                        ["Present", summary.paradePresent, "var(--success)"],
                        ["Absent", summary.paradeAbsent, "var(--danger)"],
                        ["Rate", `${summary.paradePct}%`, "var(--accent)"],
                      ].map(([label, val, color]) => (
                        <div key={label} style={{ background: "var(--gray-light)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                          <div style={{ fontWeight: 700, fontSize: 18, color: color || "var(--primary)" }}>{val ?? "—"}</div>
                          <div style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase" }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Extra Events */}
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gray)", textTransform: "uppercase", marginBottom: 6 }}>📋 Extra Events Attendance</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                      {[
                        ["Total", summary.extraTotal, ""],
                        ["Present", summary.extraPresent, "var(--success)"],
                        ["Absent", summary.extraAbsent, "var(--danger)"],
                        ["Rate", `${summary.extraPct}%`, "var(--accent)"],
                      ].map(([label, val, color]) => (
                        <div key={label} style={{ background: "var(--gray-light)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                          <div style={{ fontWeight: 700, fontSize: 18, color: color || "var(--primary)" }}>{val ?? "—"}</div>
                          <div style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase" }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Overall */}
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gray)", textTransform: "uppercase", marginBottom: 6 }}>📊 Overall</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                      {[
                        ["Total", summary.total, ""],
                        ["Present", summary.present, "var(--success)"],
                        ["Absent", summary.absent, "var(--danger)"],
                        ["Rate", `${summary.percentage}%`, "var(--accent)"],
                      ].map(([label, val, color]) => (
                        <div key={label} style={{ background: "var(--gray-light)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                          <div style={{ fontWeight: 700, fontSize: 18, color: color || "var(--primary)" }}>{val ?? "—"}</div>
                          <div style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase" }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    {summary.records?.length > 0 && (
                      <div className="table-wrap" style={{ maxHeight: 220, overflowY: "auto" }}>
                        <table>
                          <thead><tr><th>Event</th><th>Category</th><th>Date</th><th>Status</th></tr></thead>
                          <tbody>
                            {summary.records.map((r) => (
                              <tr key={r._id}>
                                <td>{r.event?.title || "—"}</td>
                                <td>{r.event?.eventCategory || "Parade"}</td>
                                <td>{r.event?.startDate ? new Date(r.event.startDate).toLocaleDateString() : "—"}</td>
                                <td><span className={`badge badge-${r.status?.toLowerCase()}`}>{r.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : <p style={{ color: "var(--gray)" }}>No attendance data.</p>}
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    </div>
  );
};

export default AdminCadetsPage;
