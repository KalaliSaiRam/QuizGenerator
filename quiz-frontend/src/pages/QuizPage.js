import React, { useState, useEffect } from "react";
import axios from "axios";
import "./QuizPage.css";

function QuizPage({ questions, topic }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeLeft, setTimeLeft] = useState(questions.length * 60);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (submitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted, timeLeft]);

  const handleAnswer = (questionIndex, optionIndex) => {
    setAnswers({
      ...answers,
      [questionIndex]: optionIndex
    });
  };

  const toggleReview = (index) => {
    setMarkedForReview({
      ...markedForReview,
      [index]: !markedForReview[index]
    });
  };

  const handleAutoSubmit = () => {
    if (!submitted) {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    try {
      const formattedAnswers = questions.map((_, index) => answers[index]);
      
      const res = await axios.post("http://localhost:8000/submit-quiz", {
        questions,
        answers: formattedAnswers,
        topic
      });
      
      setResult(res.data);
      setSubmitted(true);
      setShowResult(true);
    } catch (err) {
      console.error(err);
      alert("Error submitting quiz");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const percentage = (timeLeft / (questions.length * 60)) * 100;
    if (percentage > 50) return "normal";
    if (percentage > 25) return "warning";
    return "danger";
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;

  if (!questions || questions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-card">
          <span className="empty-icon">📚</span>
          <h2>No Quiz Loaded</h2>
          <p>Please upload study material to generate a quiz</p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      {/* Sidebar */}
      <div className="quiz-sidebar">
        <div className="sidebar-header">
          <h3>Question Navigator</h3>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{answeredCount}</span>
              <span className="stat-label">Answered</span>
            </div>
            <div className="stat">
              <span className="stat-value">{reviewCount}</span>
              <span className="stat-label">Review</span>
            </div>
            <div className="stat">
              <span className="stat-value">{questions.length}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
        </div>

        <div className="question-grid">
          {questions.map((_, index) => {
            const isAnswered = answers[index] !== undefined;
            const isMarked = markedForReview[index];
            const isCurrent = currentIndex === index;

            let statusClass = "";
            if (submitted) {
              const isCorrect = answers[index] === questions[index].correct_answer;
              statusClass = isCorrect ? "correct" : "wrong";
            } else if (isMarked) {
              statusClass = "review";
            } else if (isAnswered) {
              statusClass = "answered";
            }

            return (
              <button
                key={index}
                className={`question-btn ${statusClass} ${isCurrent ? "current" : ""}`}
                onClick={() => setCurrentIndex(index)}
              >
                {index + 1}
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

      {/* Main Content */}
      <div className="quiz-content">
        {/* Header */}
        <div className="content-header">
          <div className="topic-info">
            <span className="topic-badge">{topic}</span>
            <span className="question-count">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          
          <div className={`timer ${getTimerColor()}`}>
            <span className="timer-icon">⏱️</span>
            <span className="timer-value">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Question Card */}
        <div className="question-card">
          <h2 className="question-text">{currentQuestion.question}</h2>

          <div className="options-list">
            {Object.entries(currentQuestion.options || {}).map(([key, optionText]) => {
              const isSelected = answers[currentIndex] === key;
              const isCorrect = submitted && key === currentQuestion.correct_answer;
              const isWrong = submitted && isSelected && key !== currentQuestion.correct_answer;

              let optionClass = "option";
              if (submitted) {
                if (isCorrect) optionClass += " correct";
                if (isWrong) optionClass += " wrong";
              } else if (isSelected) {
                optionClass += " selected";
              }

              return (
                <div
                  key={key}
                  className={optionClass}
                  onClick={() => !submitted && handleAnswer(currentIndex, key)}
                >
                  <span className="option-letter">{key}</span>
                  <span className="option-text">{optionText}</span>
                  {submitted && isCorrect && <span className="check-icon">✓</span>}
                  {submitted && isWrong && <span className="cross-icon">✗</span>}
                </div>
              );
            })}
          </div>

          {submitted && currentQuestion.explanation && (
            <div className="explanation">
              <h4>Explanation</h4>
              {/* Parse detailed detailed explanation if object, else just string */}
              {typeof currentQuestion.explanation === "object" ? (
                <>
                  {answers[currentIndex] === currentQuestion.correct_answer ? (
                    <p className="correct-text">
                      <strong>Correct logic:</strong> {currentQuestion.explanation.correct}
                    </p>
                  ) : (
                    <>
                      <p className="incorrect-text">
                        <strong>Why your answer was wrong:</strong><br /> 
                        {currentQuestion.explanation.incorrect?.[answers[currentIndex]] || "Incorrect choice logic."}
                      </p>
                      <p className="correct-text" style={{marginTop: '12px'}}>
                        <strong>Correct logic:</strong> {currentQuestion.explanation.correct}
                      </p>
                    </>
                  )}
                </>
              ) : (
                <p>{currentQuestion.explanation}</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!submitted && (
          <div className="action-bar">
            <button
              className={`review-btn ${markedForReview[currentIndex] ? "active" : ""}`}
              onClick={() => toggleReview(currentIndex)}
            >
              <span className="review-icon">
                {markedForReview[currentIndex] ? "★" : "☆"}
              </span>
              {markedForReview[currentIndex] ? "Marked for Review" : "Mark for Review"}
            </button>

            <div className="nav-buttons">
              <button
                className="nav-btn"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                ← Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  className="nav-btn primary"
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                >
                  Save & Next →
                </button>
              ) : (
                <button
                  className="submit-btn"
                  onClick={submitQuiz}
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results Modal */}
        {showResult && result && (
          <div className="modal-overlay" onClick={() => setShowResult(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowResult(false)}>×</button>
              
              <h2>Quiz Results</h2>
              
              <div className="score-circle">
                <span className="score-number">{result.score}</span>
                <span className="score-total">/{result.total}</span>
              </div>
              
              <div className="score-details">
                <div className="score-item">
                  <span className="score-label">Percentage</span>
                  <span className="score-value">
                    {Math.round((result.score / result.total) * 100)}%
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-label">Grade</span>
                  <span className={`grade-badge ${result.grade.toLowerCase().replace(' ', '-')}`}>
                    {result.grade}
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-label">Time Taken</span>
                  <span className="score-value">
                    {formatTime(questions.length * 60 - timeLeft)}
                  </span>
                </div>
              </div>

              {result.summary && (
                <p className="result-summary">{result.summary}</p>
              )}

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowResult(false)}>
                  Review Answers
                </button>
                <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
                  New Quiz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizPage;