import React, { useEffect, useState } from 'react';

const QuestionAndEditor = ({ selectedQuestion }) => {
  const [description, setDescription] = useState("Loading...");
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("// Write your code here...");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  useEffect(() => {
    if (!selectedQuestion?.url) {
      setDescription("No description available.");
      return;
    }

    setDescription("Loading...");
    fetch(`/api/scrapeDescription?url=${encodeURIComponent(selectedQuestion.url)}`)
      .then(response => response.json())
      .then(data => setDescription(data.description || "No description available."))
      .catch(err => {
        console.error("Error fetching description:", err);
        setDescription("Failed to load description.");
      });
  }, [selectedQuestion]);

  const runCode = async () => {
    try {
      const res = await fetch("/api/compiler/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, input }),
      });
      const data = await res.json();
      setOutput(data.output || "Error: No Output");
    } catch (error) {
      console.error("Compiler Error:", error);
      setOutput("Failed to compile.");
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      <div style={{ flex: 1 }}>
        <h2>{selectedQuestion?.title || "Select a Question"}</h2>
        <a href={selectedQuestion?.url} target="_blank" rel="noopener noreferrer">
          View Problem Statement
        </a>
        <h3>Description:</h3>
        <p>{description}</p>
      </div>

      <div style={{ flex: 1 }}>
        <h3>Online Compiler</h3>
        <div>
          <label>Choose Language:</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>
        <div>
          <label>Write Code:</label>
          <textarea
            rows="10"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your code here..."
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <label>Input:</label>
          <textarea
            rows="2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Provide input if needed..."
            style={{ width: "100%" }}
          />
        </div>
        <button onClick={runCode}>Run Code</button>
        <div>
          <h3>Output:</h3>
          <pre>{output}</pre>
        </div>
      </div>
    </div>
  );
};

export default QuestionAndEditor;
