import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import QuizPage from "./pages/QuizPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import Navbar from "./components/Navbar";
import "./styles/global.css";

function App() {
  const [questions, setQuestions] = useState([]);
  const [topic, setTopic] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("userId");
  });

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage setIsAuthenticated={setIsAuthenticated} />} 
          />
          <Route 
            path="/signup" 
            element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage setIsAuthenticated={setIsAuthenticated} />} 
          />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <UploadPage
                  setQuestions={setQuestions}
                  setTopic={setTopic}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/quiz"
            element={
              isAuthenticated ? (
                <QuizPage
                  questions={questions}
                  topic={topic}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <DashboardPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;