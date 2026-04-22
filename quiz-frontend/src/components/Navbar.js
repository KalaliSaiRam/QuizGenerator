import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const location = useLocation();

  if (!isAuthenticated && (location.pathname === "/login" || location.pathname === "/signup")) {
    return null; // Hide navbar on login and signup pages
  }

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    setIsAuthenticated(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">
          <span className="brand-icon">✨</span>
          <span className="brand-text">Questify AI</span>
        </Link>
      </div>

      <div className="nav-links">
        {isAuthenticated && (
          <>
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            >
              Upload
            </Link>
            <Link 
              to="/dashboard" 
              className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}
            >
              Dashboard
            </Link>
            <button onClick={handleLogout} className="btn btn-outline logout-btn">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
