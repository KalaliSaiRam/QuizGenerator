import React, { useState } from "react";
import axios from "axios";

function UploadForm({ setQuestions, setTopic }) {

  const [file, setFile] = useState(null);
  const [topic, updateTopic] = useState("UPSC");
  const [difficulty, setDifficulty] = useState("Easy");
  const [count, setCount] = useState(5);
  const [inputType, setInputType] = useState("pdf");
  const [loading, setLoading] = useState(false);

  const generateQuiz = async () => {

    if (!file) {
      alert("Please upload a file");
      return;
    }

    try {

      setLoading(true);

      const formData = new FormData();

      formData.append("file", file);
      formData.append("topic", topic);
      formData.append("difficulty", difficulty);
      formData.append("count", count);
      formData.append("input_type", inputType);

      const res = await axios.post(
        "http://localhost:8000/generate-quiz",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setQuestions(res.data.questions);
      setTopic(topic);

    } catch (err) {

      console.error(err);
      alert("Error generating quiz");

    } finally {

      setLoading(false);

    }
  };

  return (

    <div
      style={{
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        maxWidth: "500px"
      }}
    >

      <h3>Upload Study Material</h3>

      <label>Input Type</label>

      <select
        value={inputType}
        onChange={(e) => setInputType(e.target.value)}
      >
        <option value="pdf">PDF</option>
        <option value="docx">DOCX</option>
        <option value="image">Image</option>
      </select>

      <br /><br />

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <label>Topic</label>

      <input
        type="text"
        value={topic}
        onChange={(e) => updateTopic(e.target.value)}
      />

      <br /><br />

      <label>Difficulty</label>

      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
      >
        <option>Easy</option>
        <option>Medium</option>
        <option>Hard</option>
      </select>

      <br /><br />

      <label>Number of Questions</label>

      <input
        type="number"
        value={count}
        onChange={(e) => setCount(e.target.value)}
      />

      <br /><br />

      <button onClick={generateQuiz}>

        {loading ? "Generating Quiz..." : "Generate Quiz"}

      </button>

    </div>

  );

}

export default UploadForm;
