import React from "react";
import "./QuestionNavigator.css";

function QuestionNavigator({
  questions,
  currentQuestion,
  setCurrentQuestion,
  answers,
  review,
  submitted
}) {
  return (
    <div className="navigator-container slide-in">
      <div className="navigator-header">
        <h3>Question Navigator</h3>
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-dot answered"></span>
            <span>Answered: {answers.filter(a => a !== undefined).length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-dot review"></span>
            <span>Review: {review.filter(r => r).length}</span>
          </div>
          {submitted && (
            <>
              <div className="stat-item">
                <span className="stat-dot correct"></span>
                <span>Correct</span>
              </div>
              <div className="stat-item">
                <span className="stat-dot wrong"></span>
                <span>Wrong</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="questions-grid">
        {questions.map((q, i) => {
          const answered = answers[i] !== undefined;
          const markedReview = review && review[i];

          let statusClass = "";
          if (submitted && answered) {
            statusClass = answers[i] === q.correct ? "correct" : "wrong";
          } else if (markedReview) {
            statusClass = "review";
          } else if (answered) {
            statusClass = "answered";
          }

          return (
            <button
              key={i}
              onClick={() => setCurrentQuestion(i)}
              className={`question-btn ${statusClass} ${
                currentQuestion === i ? "active" : ""
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-dot current"></span>
          <span>Current</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot answered"></span>
          <span>Answered</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot review"></span>
          <span>Review</span>
        </div>
        {submitted && (
          <>
            <div className="legend-item">
              <span className="legend-dot correct"></span>
              <span>Correct</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot wrong"></span>
              <span>Wrong</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default QuestionNavigator;