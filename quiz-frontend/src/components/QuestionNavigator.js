import React from "react";

function QuestionNavigator({
  questions,
  currentQuestion,
  setCurrentQuestion,
  answers,
  review,
  submitted
}) {

  return (

    <div
      style={{
        width: "200px",
        borderRight: "1px solid #ddd",
        padding: "15px"
      }}
    >

      <h3>Questions</h3>

      {questions.map((q, i) => {

        const answered = answers[i] !== undefined;
        const markedReview = review && review[i];

        let background = "#eee";
        let color = "black";

        // AFTER SUBMISSION → show correct/wrong
        if (submitted && answered) {

          if (answers[i] === q.correct) {
            background = "#4caf50"; // correct
            color = "white";
          } else {
            background = "#f44336"; // wrong
            color = "white";
          }

        } else {

          // BEFORE SUBMISSION
          if (markedReview) {
            background = "#ff9800";
            color = "white";
          } else if (answered) {
            background = "#4caf50";
            color = "white";
          }

        }

        return (

          <button
            key={i}
            onClick={() => setCurrentQuestion(i)}
            style={{
              width: "40px",
              height: "40px",
              margin: "5px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              background: background,
              color: color,
              outline:
                currentQuestion === i
                  ? "2px solid #1976d2"
                  : "none"
            }}
          >
            {i + 1}
          </button>

        );

      })}

    </div>

  );

}

export default QuestionNavigator;
