import React from "react";
import "./QuestionCard.css";

function formatQuestion(text) {
  if (!text) return "";
  return text
    .replace(/ 1\./g, "\n\n1.")
    .replace(/ 2\./g, "\n2.")
    .replace(/ 3\./g, "\n3.");
}

function QuestionCard({
  question,
  index,
  answers,
  selectAnswer,
  submitted
}) {
  const selectedAnswer = answers[index];

  return (
    <div className="question-card fade-in">
      <div className="question-header">
        <span className="question-number">Question {index + 1}</span>
        {!submitted && selectedAnswer !== undefined && (
          <span className="answered-badge">
            <span className="check-icon">✓</span> Answered
          </span>
        )}
      </div>

      <h3 className="question-text" style={{ whiteSpace: "pre-line" }}>
        {formatQuestion(question.question)}
      </h3>

      <div className="options-container">
        {question.options.map((opt, i) => {
          const isSelected = selectedAnswer === i;
          const isCorrect = submitted && i === question.correct;
          const isWrong = submitted && isSelected && i !== question.correct;

          let optionClass = "option-item";
          if (submitted) {
            if (isCorrect) optionClass += " correct";
            else if (isWrong) optionClass += " wrong";
          } else if (isSelected) {
            optionClass += " selected";
          }

          return (
            <div
              key={i}
              className={optionClass}
              onClick={() => !submitted && selectAnswer(index, i)}
            >
              <div className="option-marker">
                {String.fromCharCode(65 + i)}
              </div>
              <div className="option-text">{opt}</div>
              {submitted && isCorrect && (
                <span className="result-icon correct">✓</span>
              )}
              {submitted && isWrong && (
                <span className="result-icon wrong">✗</span>
              )}
            </div>
          );
        })}
      </div>

      {submitted && question.explanation && (
        <div className="explanation-section slide-in">
          <div className="explanation-header">
            <span className="explanation-icon">📚</span>
            <h4>Explanation</h4>
          </div>
          <p style={{ whiteSpace: "pre-line" }}>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

export default QuestionCard;