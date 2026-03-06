import React, { useState, useEffect } from "react";
import axios from "axios";

import QuizViewer from "../components/QuizViewer";
import QuestionNavigator from "../components/QuestionNavigator";

function QuizPage({ questions, topic }) {

  const [answers, setAnswers] = useState([]);
  const [review, setReview] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const [timeLeft, setTimeLeft] = useState(questions.length * 60);

  // TIMER
  useEffect(() => {

    if (submitted) return;

    const timer = setInterval(() => {

      setTimeLeft((prev) => {

        if (prev <= 1) {
          clearInterval(timer);
          submitQuiz();
          return 0;
        }

        return prev - 1;

      });

    }, 1000);

    return () => clearInterval(timer);

  }, [submitted]);

  // SELECT ANSWER
  const selectAnswer = (qIndex, optionIndex) => {

    const updated = [...answers];
    updated[qIndex] = optionIndex;

    setAnswers(updated);

  };

  // MARK REVIEW
  const toggleReview = (index) => {

    const updated = [...review];

    updated[index] = !updated[index];

    setReview(updated);

  };

  // NAVIGATION
  const nextQuestion = () => {

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }

  };

  const prevQuestion = () => {

    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }

  };

  // SUBMIT
  const submitQuiz = async () => {

    try {

      const res = await axios.post(
        "http://localhost:8000/submit-quiz",
        {
          questions,
          answers,
          topic
        }
      );

      setResult(res.data);
      setSubmitted(true);

    } catch (err) {

      console.error(err);
      alert("Error submitting quiz");

    }

  };

  // FORMAT TIMER
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const answeredCount = answers.filter(a => a !== undefined).length;

  if (!questions || questions.length === 0) {

    return (
      <div style={{ padding: "40px" }}>
        <h2>No quiz loaded</h2>
      </div>
    );

  }

  return (

    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* NAVIGATOR */}

      <QuestionNavigator
        questions={questions}
        currentQuestion={currentQuestion}
        setCurrentQuestion={setCurrentQuestion}
        answers={answers}
        review={review}
        submitted={submitted}
      />

      {/* MAIN PANEL */}

      <div style={{ flex: 1, padding: "30px" }}>

        {/* TOP PANEL */}

        <div style={{ marginBottom: "20px" }}>

          <h3>
            Timer: {minutes}:{seconds.toString().padStart(2,"0")}
          </h3>

          <p>
            Answered: {answeredCount} / {questions.length}
          </p>

        </div>

        {/* QUESTION */}

        <QuizViewer
          question={questions[currentQuestion]}
          index={currentQuestion}
          answers={answers}
          selectAnswer={selectAnswer}
          submitted={submitted}
        />

        {/* MARK REVIEW */}

        {!submitted && (

          <label>

            <input
              type="checkbox"
              checked={review[currentQuestion] || false}
              onChange={() => toggleReview(currentQuestion)}
            />

            {" "} Mark for Review

          </label>

        )}

        {/* NAVIGATION */}

        {!submitted && (

          <div style={{ marginTop: "20px" }}>

            {currentQuestion > 0 && (

              <button onClick={prevQuestion}>
                Previous
              </button>

            )}

            {currentQuestion < questions.length - 1 && (

              <button
                onClick={nextQuestion}
                style={{ marginLeft: "10px" }}
              >
                Save & Next
              </button>

            )}

            {currentQuestion === questions.length - 1 && (

              <button
                onClick={submitQuiz}
                style={{
                  marginLeft: "10px",
                  background: "#4caf50",
                  color: "white"
                }}
              >
                Submit Quiz
              </button>

            )}

          </div>

        )}

        {/* RESULT */}

        {submitted && result && (

          <div style={{ marginTop: "30px" }}>

            <h2>
              Score: {result.score} / {result.total}
            </h2>

            <h3>Grade: {result.grade}</h3>

            {result.summary && <p>{result.summary}</p>}

          </div>

        )}

      </div>

    </div>

  );

}

export default QuizPage;
