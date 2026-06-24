import React, { useState, useEffect } from 'react';
import Navbar from './Components/Navbar';
import Home from './Pages/Home';
import AdminLogin from './Pages/AdminLogin';
import AdminDashboard from './Pages/AdminDashboard';

const App = () => {
  const [path, setPath] = useState(window.location.pathname);
  const [token, setToken] = useState(localStorage.getItem("adminToken") || null);
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = localStorage.getItem("adminUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const navigateTo = (newPath) => {
    window.history.pushState({}, "", newPath);
    setPath(newPath);
  };

  useEffect(() => {
    if (!token) {
      if (path !== "/admin") {
        navigateTo("/admin");
      }
    } else {
      if (path === "/") {
        navigateTo("/admin");
      }
    }
  }, [token, path]);

  const handleLoginSuccess = (newToken, userDetails) => {
    setToken(newToken);
    setAdminUser(userDetails);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setToken(null);
    setAdminUser(null);
  };

  // If path is /admin, load the admin portal
  if (path === "/admin") {
    if (!token) {
      return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
    }
    return (
      <AdminDashboard 
        token={token} 
        user={adminUser} 
        onLogout={handleLogout} 
      />
    );
  }

  // Otherwise, load the public marketing site
  return (
    <>
      <Navbar onAdminClick={() => navigateTo("/admin")} />
      <Home />
      <footer style={{ background: "#0c0812", padding: "40px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center", fontSize: "14px", color: "#635b70" }}>
        <p style={{ margin: 0 }}>© 2026 GlamAI. All rights reserved.</p>
        <button 
          onClick={() => navigateTo("/admin")}
          style={{ background: "transparent", border: "none", color: "#ff4f8f", cursor: "pointer", marginTop: "12px", textDecoration: "underline", fontSize: "14px", fontFamily: "inherit" }}
        >
          Administrator Dashboard Portal
        </button>
      </footer>
    </>
  );
};

export default App;