import React from "react";
import "./ResultCard.css";

function ResultCard({ result, onClose }) {
  const getGradeColor = (grade) => {
    switch(grade) {
      case 'Excellent': return '#10b981';
      case 'Good': return '#3b82f6';
      case 'Average': return '#f59e0b';
      case 'Needs Improvement': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="result-card-overlay" onClick={onClose}>
      <div className="result-card" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="result-header">
          <h2>Quiz Complete! 🎉</h2>
        </div>

        <div className="score-circle" style={{ borderColor: getGradeColor(result.grade) }}>
          <span className="score-number">{result.score}</span>
          <span className="score-total">/{result.total}</span>
        </div>

        <div className="grade-section" style={{ color: getGradeColor(result.grade) }}>
          <h3>{result.grade}</h3>
        </div>

        {result.summary && (
          <div className="summary-section">
            <p>{result.summary}</p>
          </div>
        )}

        <div className="result-stats">
          <div className="stat-item">
            <span className="stat-label">Percentage</span>
            <span className="stat-value">{Math.round((result.score / result.total) * 100)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Correct Answers</span>
            <span className="stat-value">{result.score}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Questions</span>
            <span className="stat-value">{result.total}</span>
          </div>
        </div>

        <button className="review-answers-btn" onClick={onClose}>
          Review Answers
        </button>
      </div>
    </div>
  );
}

export default ResultCard;