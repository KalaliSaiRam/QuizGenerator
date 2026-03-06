import React from "react";

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

  return (

    <div
      style={{
        marginBottom: "25px",
        padding: "15px",
        border: "1px solid #ddd",
        borderRadius: "8px"
      }}
    >

      <h3 style={{ whiteSpace: "pre-line" }}>
        {index + 1}. {formatQuestion(question.question)}
      </h3>

      {question.options.map((opt, i) => (

        <div key={i} style={{ marginBottom: "6px" }}>

          <label>

            <input
              type="radio"
              name={`q-${index}`}
              checked={answers[index] === i}
              disabled={submitted}
              onChange={() => selectAnswer(index, i)}
            />

            {" "} {opt}

          </label>

        </div>

      ))}

      {submitted && (
        <div style={{ marginTop: "10px", color: "green" }}>
          <b>Correct Answer:</b> {question.options[question.correct]}
        </div>
      )}

      {submitted && question.explanation && (
        <div
          style={{
            marginTop: "10px",
            background: "#f4f6ff",
            padding: "10px",
            borderRadius: "6px"
          }}
        >
          <b>Explanation:</b>
          <p style={{ whiteSpace: "pre-line" }}>
            {question.explanation}
          </p>
        </div>
      )}

    </div>

  );
}

export default QuestionCard;
