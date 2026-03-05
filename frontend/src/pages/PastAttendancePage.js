import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";

const PastAttendancePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const { data } = await api.get("/attendance/all-events");
        setEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, []);

  const filtered = events.filter((e) =>
    !search ||
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1>Past Attendance</h1>
            <p>View and update attendance for all past events up to today</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>All Past Events</h2>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "8px 14px", border: "1.5px solid var(--gray-mid)", borderRadius: 8, fontSize: 14, width: 220 }}
            />
          </div>

          {loading ? (
            <p>Loading events...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: "var(--gray)", textAlign: "center", padding: 24 }}>No past events found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Attendance</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e, i) => (
                    <tr key={e._id}>
                      <td style={{ color: "var(--gray)" }}>{i + 1}</td>
                      <td><strong>{e.title}</strong></td>
                      <td><span className={`badge badge-${e.type?.toLowerCase()}`}>{e.type}</span></td>
                      <td>{new Date(e.startDate).toLocaleDateString()}</td>
                      <td>{e.location || "—"}</td>
                      <td>
                        {e.attendanceMarked ? (
                          <span className="badge badge-present">
                            {e.presentCount}/{e.totalMarked} Present
                          </span>
                        ) : (
                          <span className="badge badge-absent">Not Marked</span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/mark-attendance/${e._id}`}
                          className="btn btn-sm btn-primary"
                        >
                          {e.attendanceMarked ? "Update" : "Mark"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PastAttendancePage;
