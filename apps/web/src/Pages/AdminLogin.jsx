import React, { useState } from "react";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import "../Styles/admin.css";

const AdminLogin = ({ onLoginSuccess }) => {
  const [role, setRole] = useState("super_admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, selectedRole: role }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.message || "Login failed");
      }

      // Save token, user info and selected role
      localStorage.setItem("adminToken", resData.data.token);
      localStorage.setItem("adminUser", JSON.stringify(resData.data));
      localStorage.setItem("simulatedRole", role);
      
      onLoginSuccess(resData.data.token, resData.data, role);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <ShieldCheck size={48} className="auth-logo" style={{ color: "var(--primary)", margin: "0 auto 10px" }} />
          <h2 className="auth-title">GlamAI Admin</h2>
          <p className="auth-subtitle">Sign in to manage your marketplace</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Administrative Role</label>
            <div className="select-wrapper">
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="super_admin">Super Admin</option>
                <option value="compliance">Compliance & Verification Officer</option>
                <option value="support">Customer Support Specialist</option>
                <option value="finance">Financial Administrator</option>
                <option value="tech_lead">Technical Lead</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="admin@glamai.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Authenticating..." : "Sign In to Portal"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
