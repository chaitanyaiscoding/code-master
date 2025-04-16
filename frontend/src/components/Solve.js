import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Solve = () => {
  const { questionId } = useParams();
  const [question, setQuestion] = useState(null);
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [output, setOutput] = useState("");

  useEffect(() => {
    axios.get(`http://localhost:5000/api/question/${questionId}`)
      .then(response => {
        setQuestion(response.data);
        return axios.get(`http://localhost:5000/api/scrapeDescription`, {
          params: { url: response.data.url }
        });
      })
      .then(response => {
        setDescription(response.data.description);
      })
      .catch(error => {
        console.error("Error fetching question or description:", error);
      });
  }, [questionId]);

  const handleRunCode = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/compiler/run", {
        language,
        code,
        input: "",
      });
      setOutput(response.data.stdout || response.data.stderr);
    } catch (error) {
      setOutput("Error executing code");
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      height: "100vh",
      padding: "20px",
      boxSizing: "border-box"
    }}>
      
      {/* Left Panel: Description */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        paddingRight: "20px",
        borderRight: "2px solid #ddd"
      }}>
        <h2>{question?.title} ({question?.difficulty})</h2>
        {description ? (
          <>
            <h4>Description:</h4>
            <p style={{ whiteSpace: "pre-wrap" }}>{description}</p>
          </>
        ) : (
          <p>Loading description...</p>
        )}
        <p>
          <a href={question?.url} target="_blank" rel="noopener noreferrer" style={{ color: "blue" }}>
            Open full problem statement
          </a>
        </p>
      </div>

      {/* Right Panel: Code Editor */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#f9f9f9",
        padding: "20px",
        borderRadius: "8px"
      }}>
        <label style={{ marginBottom: "10px", fontWeight: "bold" }}>Write Your Code:</label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={15}
          style={{
            width: "100%",
            resize: "vertical",
            borderRadius: "5px",
            border: "1px solid #ccc",
            padding: "10px",
            fontFamily: "monospace"
          }}
        />
        <button
          onClick={handleRunCode}
          style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Run Code
        </button>
        <div style={{ marginTop: "20px" }}>
          <h3>Output:</h3>
          <pre style={{
            background: "#eee",
            padding: "10px",
            borderRadius: "5px",
            minHeight: "50px"
          }}>
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default Solve;


