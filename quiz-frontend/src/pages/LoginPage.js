import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

function LoginPage({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    
    // Simulate an API login call
    setTimeout(() => {
      setLoading(false);
      // Mock validation (accepts any input for demo)
      setIsAuthenticated(true);
      navigate("/");
    }, 1500);
  };

  return (
    <div className="login-container">
      <div className="login-card-wrapper fade-in">
        <div className="login-card card">
          <div className="login-header">
            <div className="logo-icon">✨</div>
            <h2>Welcome Back</h2>
            <p>Enter your details to access the AI Quiz Generator.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="option-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="option-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="forgot-password">
                <a href="#reset">Forgot Password?</a>
              </div>
            </div>

            <button
              type="submit"
              className={`generate-btn btn-primary ${loading ? "loading" : ""}`}
              disabled={loading}
              style={{ width: "100%", marginTop: "10px" }}
            >
              {loading ? <span className="spinner"></span> : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <a href="#signup">Sign up</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
