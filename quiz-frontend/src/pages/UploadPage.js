import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UploadPage.css";

function UploadPage({ setQuestions, setTopic }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [topic, setTopicName] = useState("UPSC");
  const [difficulty, setDifficulty] = useState("Easy");
  const [count, setCount] = useState(10);
  const [inputType, setInputType] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
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
      navigate("/quiz");
    } catch (err) {
      console.error(err);
      alert("Error generating quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-wrapper">
        {/* Header */}
        <div className="upload-header">
          <h1>Create New Quiz</h1>
          <p>Upload your study material and let AI generate intelligent questions</p>
        </div>

        {/* Main Form */}
        <div className="upload-form card">
          {/* File Type Selection */}
          <div className="type-selector">
            {["pdf", "docx", "image"].map((type) => (
              <button
                key={type}
                className={`type-btn ${inputType === type ? "active" : ""}`}
                onClick={() => setInputType(type)}
              >
                {type === "pdf" && "📄"} {type === "docx" && "📝"} {type === "image" && "🖼️"}
                {type.toUpperCase()}
              </button>
            ))}
          </div>

          {/* File Upload Area */}
          <div
            className={`drop-zone ${dragActive ? "active" : ""} ${file ? "has-file" : ""}`}
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
            
            {file ? (
              <div className="file-info">
                <span className="file-icon">
                  {inputType === "pdf" ? "📄" : inputType === "docx" ? "📝" : "🖼️"}
                </span>
                <div className="file-details">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <button 
                  className="remove-file"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="upload-icon">📤</div>
                <h3>Drag & drop your file here</h3>
                <p>or click to browse</p>
                <div className="file-types">
                  <span>PDF</span>
                  <span>DOCX</span>
                  <span>Image</span>
                </div>
              </>
            )}
          </div>

          {/* Options */}
          <div className="options-grid">
            <div className="option-group">
              <label>Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g., UPSC, History"
                className="option-input"
              />
            </div>

            <div className="option-group">
              <label>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="option-select"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="option-group">
              <label>Questions</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                min="1"
                max="50"
                className="option-input"
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            className={`generate-btn ${loading ? "loading" : ""}`}
            onClick={generateQuiz}
            disabled={loading || !file}
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

        {/* Features */}
        <div className="features">
          <div className="feature">
            <span className="feature-icon">📊</span>
            <h4>Smart Questions</h4>
            <p>AI generates relevant questions based on your content</p>
          </div>
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <h4>Instant Results</h4>
            <p>Get immediate feedback and explanations</p>
          </div>
          <div className="feature">
            <span className="feature-icon">📈</span>
            <h4>Track Progress</h4>
            <p>Monitor your performance and improve</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;