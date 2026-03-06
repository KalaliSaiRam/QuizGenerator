import React from "react";
import { useNavigate } from "react-router-dom";
import UploadForm from "../components/UploadForm";

function UploadPage({ setQuestions, setTopic }) {

  const navigate = useNavigate();

  const handleQuestions = (qs) => {

    setQuestions(qs);
    navigate("/quiz");
  };

  return (

    <div style={{ padding: "40px" }}>

      <h1>AI Quiz Generator</h1>

      <UploadForm
        setQuestions={handleQuestions}
        setTopic={setTopic}
      />

    </div>

  );
}

export default UploadPage;
