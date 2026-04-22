import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./SignupPage.css";

function SignupPage({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const res = await axios.post(`${apiUrl}/signup`, {
        name,
        email,
        password
      });

      // Save user session
      localStorage.setItem("userId", res.data.user_id);
      localStorage.setItem("userName", res.data.name);
      
      setIsAuthenticated(true);
      navigate("/");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Error creating account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card-wrapper fade-in">
        <div className="signup-card card">
          <div className="signup-header">
            <div className="logo-icon">🚀</div>
            <h2>Create an Account</h2>
            <p>Join the AI Quiz Generator and start learning faster.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSignup} className="signup-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className={`generate-btn btn-primary ${loading ? "loading" : ""}`}
              disabled={loading}
              style={{ width: "100%", marginTop: "10px" }}
            >
              {loading ? <span className="spinner"></span> : "Sign Up"}
            </button>
          </form>

          <div className="signup-footer">
            <p>Already have an account? <Link to="/login">Log in here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
