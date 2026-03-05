import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const EyeIcon = ({ visible }) => visible
  ? <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
  : <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;

const PwField = ({ label, name, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="pw-wrap">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          required
          placeholder={placeholder}
        />
        <button type="button" className="pw-eye" onClick={() => setShow(!show)}>
          <EyeIcon visible={show} />
        </button>
      </div>
    </div>
  );
};

const ChangePasswordPage = () => {
  const { updateUser } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMsg({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ type: "error", text: "New password and confirm password do not match" });
      return;
    }
    if (form.newPassword.length < 6) {
      setMsg({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      await api.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      updateUser({ isDefaultPassword: false });
      setMsg({ type: "success", text: "Password changed successfully!" });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to change password" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Change Password</h1>
          <p>Update your login password. Default password is your regimental number.</p>
        </div>

        <div className="card" style={{ maxWidth: 480 }}>
          {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit}>
            <PwField label="Current Password *" name="currentPassword" value={form.currentPassword} onChange={handleChange} placeholder="Enter current password" />
            <PwField label="New Password *" name="newPassword" value={form.newPassword} onChange={handleChange} placeholder="Min. 6 characters" />
            <PwField label="Confirm New Password *" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat new password" />
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 160 }}>
              {saving ? <><span className="spinner" /> Changing...</> : "🔒 Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
