import React, { useState } from "react";
import axios from "axios";

function App() {

  const [file, setFile] = useState(null);
  const [topic, setTopic] = useState("UPSC");
  const [difficulty, setDifficulty] = useState("Easy");
  const [count, setCount] = useState(5);
  const [inputType, setInputType] = useState("pdf");

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const generateQuiz = async () => {

    const formData = new FormData();

    formData.append("input_type", inputType);
    formData.append("topic", topic);
    formData.append("difficulty", difficulty);
    formData.append("count", count);
    formData.append("file", file);

    try {

      const res = await axios.post(
        "http://127.0.0.1:8000/generate-quiz",
        formData
      );

      console.log(res.data);   // debug

      setQuestions(res.data.questions || []);

    } catch (err) {

      console.error("API Error:", err);
      alert("Error generating quiz");

    }
  };
  const handleSelect = (qIndex, optIndex) => {

  setAnswers({
    ...answers,
    [qIndex]: optIndex
  });

};

const submitQuiz = () => {
  setSubmitted(true);
};

  return (

    <div style={{padding:"40px", fontFamily:"Arial"}}>

      <h1>AI Quiz Generator</h1>

      <h3>Select Input Type</h3>

      <select onChange={(e)=>setInputType(e.target.value)}>

        <option value="pdf">PDF</option>
        <option value="docx">DOCX</option>
        <option value="image">Image</option>

      </select>

      <br/><br/>

      <input
        type="file"
        onChange={(e)=>setFile(e.target.files[0])}
      />

      <br/><br/>

      <input
        placeholder="Topic"
        value={topic}
        onChange={(e)=>setTopic(e.target.value)}
      />

      <br/><br/>

      <select
        onChange={(e)=>setDifficulty(e.target.value)}
      >

        <option>Easy</option>
        <option>Medium</option>
        <option>Hard</option>

      </select>

      <br/><br/>

      <input
        type="number"
        value={count}
        onChange={(e)=>setCount(e.target.value)}
      />

      <br/><br/>

      <button onClick={generateQuiz}>
        Generate Quiz
      </button>

      <hr/>

      {questions?.map((q,i)=>(

  <div key={i} style={{marginBottom:"25px"}}>

    <h3>{i+1}. {q.question}</h3>

    {q.options?.map((opt,j)=>(

      <div key={j}>

        <label>

          <input
            type="radio"
            name={`q-${i}`}
            value={j}
            onChange={()=>handleSelect(i,j)}
            disabled={submitted}
          />

          {opt}

        </label>

        {submitted && q.correct === j && (
          <span style={{color:"green"}}> ✓ Correct</span>
        )}

        {submitted && answers[i] === j && q.correct !== j && (
          <span style={{color:"red"}}> ✗ Wrong</span>
        )}

      </div>

    ))}

  </div>

))}
{questions.length > 0 && !submitted && (

  <button onClick={submitQuiz}>
    Submit Quiz
  </button>

)}
{submitted && (

  <h2>

    Score: {
      questions.filter((q,i)=>answers[i] === q.correct).length
    } / {questions.length}

  </h2>

)}

    </div>
    

  );
}

export default App;