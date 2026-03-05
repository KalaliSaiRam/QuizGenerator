import React, { useState } from "react";
import UploadForm from "./components/UploadForm";
import QuizViewer from "./components/QuizViewer";

function App() {

  const [questions, setQuestions] = useState([]);

  return (
    <div>

      <UploadForm setQuestions={setQuestions} />

      <QuizViewer questions={questions} />

    </div>
  );
}

export default App;