import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./DashboardPage.css";

function DashboardPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const res = await axios.get(`${apiUrl}/history`, {
        headers: { "X-User-Id": localStorage.getItem("userId") || "" }
      });
      setHistory(res.data.history);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  const calculateAverage = () => {
    if (history.length === 0) return 0;
    const sum = history.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / history.length);
  };

  const getBestSubject = () => {
    if (history.length === 0) return "N/A";
    const topics = {};
    history.forEach(curr => {
      if (!topics[curr.topic]) {
        topics[curr.topic] = { totalScore: 0, count: 0 };
      }
      topics[curr.topic].totalScore += curr.percentage;
      topics[curr.topic].count += 1;
    });

    let best = null;
    let maxAvg = -1;

    for (const [topic, data] of Object.entries(topics)) {
      const avg = data.totalScore / data.count;
      if (avg > maxAvg) {
        maxAvg = avg;
        best = topic;
      }
    }
    return best;
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        <div className="dashboard-header">
          <h1>Performance Dashboard</h1>
          <p>Analyze your historical quiz data to optimize your study strategy.</p>
        </div>

        {/* Top Analytics Cards */}
        <div className="metrics-grid">
          <div className="metric-card fade-in">
            <span className="metric-icon">📈</span>
            <h3>Average Score</h3>
            <div className="metric-value">{loading ? "-" : `${calculateAverage()}%`}</div>
          </div>
          <div className="metric-card fade-in" style={{animationDelay: "0.1s"}}>
            <span className="metric-icon">🎯</span>
            <h3>Quizzes Completed</h3>
            <div className="metric-value">{loading ? "-" : history.length}</div>
          </div>
          <div className="metric-card fade-in" style={{animationDelay: "0.2s"}}>
            <span className="metric-icon">⭐</span>
            <h3>Best Subject</h3>
            <div className="metric-value">{loading ? "-" : getBestSubject()}</div>
          </div>
        </div>

        {/* History Table */}
        <div className="history-section card fade-in" style={{animationDelay: "0.3s"}}>
          <div className="history-section-header">
            <h3>Recent Quizzes</h3>
            <Link to="/" className="btn btn-primary">Take New Quiz</Link>
          </div>

          {loading ? (
            <div className="loading-state">
               <span className="spinner"></span> Loading history...
            </div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : history.length > 0 ? (
            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Topic</th>
                    <th>Score</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr key={record.id}>
                      <td>{formatDate(record.timestamp)}</td>
                      <td className="topic-cell">{record.topic}</td>
                      <td>
                        <div className="score-bar-container">
                          <div className="score-text">{record.score} / {record.total} ({Math.round(record.percentage)}%)</div>
                          <div className="score-bar-bg">
                            <div 
                              className={`score-bar-fill ${record.grade.toLowerCase()}`}
                              style={{ width: `${record.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`grade-badge ${record.grade.toLowerCase()}`}>
                          {record.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-history">
              <div className="empty-icon">📚</div>
              <h4>No History Yet</h4>
              <p>Complete your first quiz to see your analytics here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
