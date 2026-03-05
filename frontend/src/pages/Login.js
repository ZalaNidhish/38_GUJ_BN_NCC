import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const EyeIcon = ({ visible }) => visible
  ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
  : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;

const NCCEmblem = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#1e3a5f" stroke="#c8a951" strokeWidth="2.5"/>
    <polygon points="32,10 37,25 52,25 40,34 44,50 32,41 20,50 24,34 12,25 27,25" fill="#c8a951" opacity="0.9"/>
    <text x="32" y="56" textAnchor="middle" fill="#c8a951" fontSize="8" fontWeight="bold" fontFamily="serif" letterSpacing="2">NCC</text>
  </svg>
);

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ regimentalNumber: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.regimentalNumber, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="logo">
          <NCCEmblem />
          <h1>NCC Portal</h1>
          <p>National Cadet Corps</p>
          <p className="login-motto">Unity &amp; Discipline</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Regimental Number</label>
            <input
              type="text"
              name="regimentalNumber"
              placeholder="e.g. GJ2025SDIA1650001"
              value={form.regimentalNumber}
              onChange={handleChange}
              required
              autoFocus
              style={{ textTransform: "uppercase" }}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="pw-wrap">
              <input
                type={showPw ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button type="button" className="pw-eye" onClick={() => setShowPw(!showPw)}>
                <EyeIcon visible={showPw} />
              </button>
            </div>
            <p className="form-hint">Default password is your regimental number</p>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "12px" }}
          >
            {loading ? <><span className="spinner" /> Signing in...</> : "Sign In"}
          </button>
        </form>

        <p className="login-footer-note">
          For access issues, contact your NCC Officer.
        </p>
      </div>
    </div>
  );
};

export default Login;
