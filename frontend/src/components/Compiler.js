import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../App.css";
function Compiler() {
  const { questionId } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/question/${questionId}`);
        const questionData = response.data;

        if (!questionData.description && questionData.url) {
          const scrapeRes = await axios.get(`http://localhost:5000/api/scrapeDescription?url=${encodeURIComponent(questionData.url)}`);
          questionData.description = scrapeRes.data.description;
        }

        setQuestion(questionData);
      } catch (error) {
        setError("Failed to load question details.");
      }
      setLoading(false);
    };

    fetchQuestion();
  }, [questionId]);

  const runCode = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/compiler/run", {
        language,
        code,
        input,
      });
      setOutput(response.data.stdout || response.data.stderr || "No output");
    } catch (error) {
      setOutput("Error running code");
    }
  };

  const markAsSolved = async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      alert("Please log in to mark as solved.");
      return;
    }

    const questionData = {
      email: email,
      questionId: question._id,    // Send MongoDB ID
      questionTitle: question.title,
      topic: question.topic
    };

    try {
      const response = await fetch('http://localhost:5000/mark-solved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData)
      });

      const data = await response.json();
      alert(data.message);
    } catch (err) {
      alert("Error marking as solved!");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ display: "flex", height: "90vh", gap: "20px", padding: "20px" }}>
      {/* Left Side - Problem Statement */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "20px", borderRight: "2px solid #ccc" }}>
        <h2>{question.title} ({question.difficulty})</h2>
        <p>
          <a href={question.url} target="_blank" rel="noopener noreferrer" style={{ color: "blue" }}>
            View Problem on Original Site
          </a>
        </p>
        <h3>Description:</h3>
        <p>{question.description || "No description available."}</p>
      </div>

      {/* Right Side - Compiler */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <h3>Online Compiler</h3>
        <label>Choose Language:</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ marginBottom: "10px" }}>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
        </select>

        <label>Write Code:</label>
        <textarea 
          value={code} 
          onChange={(e) => setCode(e.target.value)} 
          placeholder="Write your code here..." 
          style={{ width: "100%", height: "150px", marginBottom: "10px" }}
        />

        <label>Input:</label>
        <textarea 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Provide input if needed..." 
          style={{ width: "100%", height: "50px", marginBottom: "10px" }}
        />

        <button onClick={runCode} style={{ padding: "10px", marginBottom: "10px" }}>Run Code</button>

        <h3>Output:</h3>
        <pre style={{ background: "#f4f4f4", padding: "10px", minHeight: "50px" }}>{output}</pre>

        <button onClick={markAsSolved} style={{ marginTop: "20px", padding: "10px", background: "#4CAF50", color: "white", border: "none", borderRadius: "5px" }}>
          Mark as Solved
        </button>
      </div>
    </div>
  );
}

export default Compiler;
