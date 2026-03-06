import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import UploadPage from "./pages/UploadPage";
import QuizPage from "./pages/QuizPage";

function App() {

  const [questions, setQuestions] = useState([]);
  const [topic, setTopic] = useState("UPSC");

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={
            <UploadPage
              setQuestions={setQuestions}
              setTopic={setTopic}
            />
          }
        />

        <Route
          path="/quiz"
          element={
            <QuizPage
              questions={questions}
              topic={topic}
            />
          }
        />

      </Routes>

    </BrowserRouter>

  );
}

export default App;
