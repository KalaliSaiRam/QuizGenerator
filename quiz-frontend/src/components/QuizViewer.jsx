import React, { useState } from "react";

export default function QuizViewer({ questions }) {

  const [answers, setAnswers] = useState({});

  const selectAnswer = (qIndex, optIndex) => {
    setAnswers({...answers, [qIndex]:optIndex});
  };

  return (
    <div>

      {questions.map((q,i)=>(
        <div key={i}>

          <h3>{i+1}. {q.question}</h3>

          {q.options.map((opt,j)=>(
            <div key={j}>
              <label>
                <input
                  type="radio"
                  name={`q${i}`}
                  onChange={()=>selectAnswer(i,j)}
                />
                {opt}
              </label>
            </div>
          ))}

        </div>
      ))}

    </div>
  );
}