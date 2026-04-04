import React from "react";
import "./Timer.css";

function Timer({ timeLeft, totalTime }) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / totalTime) * 100;

  const getTimerColor = () => {
    if (progress > 50) return "success";
    if (progress > 25) return "warning";
    return "danger";
  };

  return (
    <div className="timer-container">
      <div className="timer-display">
        <span className="timer-icon">⏱️</span>
        <span className={`timer-value ${getTimerColor()}`}>
          {minutes.toString().padStart(2, "0")}:
          {seconds.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="timer-progress">
        <div
          className={`timer-progress-bar ${getTimerColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default Timer;