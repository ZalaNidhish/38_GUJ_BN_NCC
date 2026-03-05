import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

/* ---- Default Avatar SVG ---- */
const DefaultAvatar = ({ size = 96 }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="48" cy="48" r="48" fill="#e2e8f0"/>
    <circle cx="48" cy="36" r="16" fill="#94a3b8"/>
    <ellipse cx="48" cy="80" rx="28" ry="18" fill="#94a3b8"/>
  </svg>
);

/* ---- Profile Picture Upload ---- */
const ProfilePicture = ({ currentUrl, onUpload, uploading, setUploading }) => {
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2 MB."); return; }

    setUploading(true);
    try {
      const CLOUD_NAME    = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME    || "your_cloud_name";
      const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "ncc_portal";
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      fd.append("folder", "ncc_portal/profiles");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onUpload(data.secure_url);
    } catch (err) {
      alert("Photo upload failed. Please check your Cloudinary configuration in .env");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-pic-section">
      <div className="profile-avatar-lg">
        {currentUrl
          ? <img src={currentUrl} alt="Profile" />
          : <DefaultAvatar size={110} />
        }
      </div>
      <label className="upload-btn-label" htmlFor="profile-pic-input">
        {uploading ? "Uploading..." : "Change Photo"}
      </label>
      <input id="profile-pic-input" ref={fileRef} type="file" accept="image/*"
        style={{ display: "none" }} onChange={handleFile} disabled={uploading} />
      <p className="upload-hint">JPG or PNG, max 2 MB</p>
    </div>
  );
};

/* ---- Read-only locked field ---- */
const LockedField = ({ label, value }) => (
  <div className="profile-field">
    <span className="field-label">{label}</span>
    <span className="field-value locked">{value || "—"}</span>
    <span className="lock-icon" title="This field is managed by your NCC officer">
      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
      </svg>
    </span>
  </div>
);

/* ---- Main ---- */
const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const isAdmin = user?.role === "admin";

  const [profile, setProfile]     = useState(null);
  const [editing, setEditing]     = useState(false);
  const [form, setForm]           = useState({});
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]             = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Both admin and cadet now use the same profile endpoint pattern
        const endpoint = isAdmin ? "/admin/profile" : "/cadet/profile";
        const { data } = await api.get(endpoint);
        setProfile(data);
        setForm({ address: data.address || "", photo: data.photo || "" });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isAdmin]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePhotoUpload = (url) => setForm((f) => ({ ...f, photo: url }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const endpoint = isAdmin ? "/admin/profile" : "/cadet/profile";
      // Both admin and cadet only send editable fields (address + photo)
      const { data } = await api.put(endpoint, { address: form.address, photo: form.photo });
      setProfile(data);
      setEditing(false);
      setMsg({ type: "success", text: "Profile updated successfully." });
      // Refresh sidebar name/rank from updated profile
      await refreshProfile();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="page-layout"><Sidebar /><div className="main-content"><p className="loading-text">Loading profile...</p></div></div>
  );

  if (!profile) return (
    <div className="page-layout"><Sidebar /><div className="main-content">
      <div className="alert alert-error">
        Profile not found. Please ensure the Excel sheet contains your regimental number and seed was run.
      </div>
    </div></div>
  );

  const roleLabel = isAdmin ? (profile.rank || "Administrator") : "Cadet";

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1>My Profile</h1>
            <p>{roleLabel} · {user?.regimentalNumber}</p>
          </div>
          {!editing && (
            <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
          )}
        </div>

        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <div className="info-banner">
          Fields marked with a lock icon are maintained by your NCC officer and cannot be edited here.
        </div>

        <div className="profile-layout">
          {/* Left column — avatar */}
          <div className="profile-left">
            {editing ? (
              <ProfilePicture
                currentUrl={form.photo}
                onUpload={handlePhotoUpload}
                uploading={uploading}
                setUploading={setUploading}
              />
            ) : (
              <div className="profile-pic-section">
                <div className="profile-avatar-lg">
                  {profile.photo
                    ? <img src={profile.photo} alt="Profile" />
                    : <DefaultAvatar size={110} />
                  }
                </div>
                <p className="avatar-name">{profile.name || user?.regimentalNumber}</p>
                {profile.rank     && <p className="avatar-rank">{profile.rank}</p>}
                {profile.battalion && <p className="avatar-unit">{profile.battalion}</p>}
              </div>
            )}
          </div>

          {/* Right column — details */}
          <div className="profile-right">
            {!editing && (
              <div className="card profile-info-card">
                <div className="profile-section-title">Personal Information</div>
                <div className="profile-fields">
                  <LockedField label="Full Name"         value={profile.name} />
                  <LockedField label="Regimental Number" value={profile.regimentalNumber} />
                  <LockedField label="Rank"              value={profile.rank} />
                  <LockedField label="Wing"              value={profile.wing} />
                  <LockedField label="Battalion"         value={profile.battalion} />
                  <LockedField label="Phone"             value={profile.phone} />
                  <LockedField label="Gender"            value={profile.gender} />
                  <LockedField label="Date of Birth"     value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN") : "—"} />
                  <LockedField label="Joining Year"      value={profile.joiningYear} />
                  <div className="profile-field editable-field">
                    <span className="field-label">Address</span>
                    <span className="field-value">{profile.address || "Not set"}</span>
                  </div>
                </div>

                {/* Attendance summary — show for cadets, hide for admin (zeros) */}
                {(!isAdmin || profile.totalParades > 0) && (
                  <>
                    <div className="profile-section-title" style={{ marginTop: 24 }}>Attendance Summary</div>
                    <div className="attendance-summary">
                      <div className="att-stat">
                        <span className="att-value">{profile.totalParades}</span>
                        <span className="att-label">Total Parades</span>
                      </div>
                      <div className="att-stat">
                        <span className="att-value">{profile.paradesPresent}</span>
                        <span className="att-label">Present</span>
                      </div>
                      <div className="att-stat highlight">
                        <span className="att-value">{profile.attendancePct}%</span>
                        <span className="att-label">Attendance</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {editing && (
              <div className="card">
                <h2 style={{ marginBottom: 8, color: "var(--primary)", fontSize: 16, fontWeight: 600 }}>
                  Update Editable Details
                </h2>
                <p className="edit-note" style={{ marginBottom: 20 }}>
                  Only your address and profile photo can be updated here. All other details are maintained by your NCC officer.
                </p>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Address</label>
                    <textarea
                      name="address"
                      value={form.address || ""}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Enter your current address"
                    />
                  </div>

                  <div className="flex gap-8 mt-16">
                    <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                      {saving ? <><span className="spinner" /> Saving...</> : "Save Changes"}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
