import React from "react";
import QuestionCard from "./QuestionCard";

function QuizViewer({
  question,
  index,
  answers,
  selectAnswer,
  submitted
}) {

  if (!question) return null;

  return (

    <div style={{ padding: "20px", flex: 1 }}>

      <QuestionCard
        question={question}
        index={index}
        answers={answers}
        selectAnswer={selectAnswer}
        submitted={submitted}
      />

    </div>

  );

}

export default QuizViewer;
