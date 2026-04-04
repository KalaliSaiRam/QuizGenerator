import React, { useState } from "react";
import axios from "axios";
import "./UploadForm.css";

function UploadForm({ setQuestions, setTopic }) {
  const [file, setFile] = useState(null);
  const [topic, updateTopic] = useState("UPSC");
  const [difficulty, setDifficulty] = useState("Easy");
  const [count, setCount] = useState(5);
  const [inputType, setInputType] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setFile(file);
    setFileName(file.name);
  };

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
        { headers: { "Content-Type": "multipart/form-data" } }
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
    <div className="upload-container fade-in">
      <div className="upload-header">
        <h2>Create New Quiz</h2>
        <p>Upload your study material and let AI generate questions</p>
      </div>

      <div className="upload-form">
        <div className="form-group">
          <label>Input Type</label>
          <div className="input-type-selector">
            {["pdf", "docx", "image"].map((type) => (
              <button
                key={type}
                className={`type-btn ${inputType === type ? "active" : ""}`}
                onClick={() => setInputType(type)}
                type="button"
              >
                {type.toUpperCase()}
                {type === "pdf" && " 📄"}
                {type === "docx" && " 📝"}
                {type === "image" && " 🖼️"}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`file-upload-area ${dragActive ? "drag-active" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input").click()}
        >
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            accept={
              inputType === "pdf"
                ? ".pdf"
                : inputType === "docx"
                ? ".docx,.doc"
                : "image/*"
            }
            hidden
          />
          <div className="upload-icon">📤</div>
          {fileName ? (
            <div className="file-name">
              <span className="file-icon">
                {inputType === "pdf" ? "📄" : inputType === "docx" ? "📝" : "🖼️"}
              </span>
              {fileName}
            </div>
          ) : (
            <>
              <p>Drag & drop your file here</p>
              <p className="upload-subtext">or click to browse</p>
            </>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => updateTopic(e.target.value)}
              placeholder="e.g., UPSC, History, Science"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="form-select"
            >
              <option value="Easy">🌱 Easy</option>
              <option value="Medium">📚 Medium</option>
              <option value="Hard">🎯 Hard</option>
            </select>
          </div>

          <div className="form-group">
            <label>Questions</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min="1"
              max="20"
              className="form-input"
            />
          </div>
        </div>

        <button
          onClick={generateQuiz}
          disabled={loading}
          className={`generate-btn ${loading ? "loading" : ""}`}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Generating Quiz...
            </>
          ) : (
            <>
              <span>✨</span>
              Generate Quiz
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default UploadForm;