import React, { useState } from "react";
import { generateQuiz } from "../../../frontend/src/api";

export default function UploadForm({ setQuestions }) {

  const [file, setFile] = useState(null);
  const [topic, setTopic] = useState("UPSC");
  const [difficulty, setDifficulty] = useState("Easy");
  const [count, setCount] = useState(5);
  const [inputType, setInputType] = useState("pdf");

  const handleSubmit = async () => {

    const formData = new FormData();

    formData.append("input_type", inputType);
    formData.append("topic", topic);
    formData.append("difficulty", difficulty);
    formData.append("count", count);
    formData.append("file", file);

    const res = await generateQuiz(formData);

    setQuestions(res.data.questions);
  };

  return (
    <div>

      <h2>AI Quiz Generator</h2>

      <label>Input Type</label>
      <select onChange={(e)=>setInputType(e.target.value)}>
        <option value="pdf">PDF</option>
        <option value="docx">DOCX</option>
        <option value="image">Image</option>
      </select>

      <br/>

      <input type="file"
        onChange={(e)=>setFile(e.target.files[0])}
      />

      <br/>

      <input
        placeholder="Topic"
        value={topic}
        onChange={(e)=>setTopic(e.target.value)}
      />

      <br/>

      <select
        onChange={(e)=>setDifficulty(e.target.value)}
      >
        <option>Easy</option>
        <option>Medium</option>
        <option>Hard</option>
      </select>

      <br/>

      <input
        type="number"
        value={count}
        onChange={(e)=>setCount(e.target.value)}
      />

      <br/>

      <button onClick={handleSubmit}>
        Generate Quiz
      </button>

    </div>
  );
}