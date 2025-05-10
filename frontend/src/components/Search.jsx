import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import leetcodeLogo from "../assets/leetcode.png";
import codechefLogo from "../assets/codechef.png";
import codeforcesLogo from "../assets/codeforces.png";

const sourceIcons = {
  LeetCode: leetcodeLogo,
  CodeChef: codechefLogo,
  Codeforces: codeforcesLogo,
};

const Search = () => {
  const [topic, setTopic] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [solved, setSolved] = useState([]);
  const navigate = useNavigate();

  const userEmail = localStorage.getItem("email");

  const handleSearch = async () => {
    if (!topic) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/search?topic=${encodeURIComponent(topic)}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
        setError(data.error || "Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch problems. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSolvedQuestions = async () => {
    if (!userEmail) return;

    try {
      const res = await fetch(`http://localhost:5000/api/user/solved?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSolved(data);
      }
    } catch (err) {
      console.error("Failed to fetch solved questions", err);
    }
  };

  useEffect(() => {
    if (results.length > 0) {
      fetchSolvedQuestions();
    }
  }, [results]);

  const handleSolve = (question) => {
    navigate(`/solve/${question._id}`, { state: { question } });
  };

  const groupedResults = Array.isArray(results)
    ? results.reduce((acc, question) => {
        acc[question.source] = acc[question.source] || [];
        acc[question.source].push(question);
        return acc;
      }, {})
    : {};

  return (
    <div className="search-container">
      <h2 className="title">Search Problems from LeetCode, CodeChef & Codeforces</h2>
      <div className="search-box">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter topic (e.g., greedy,Dynamic Programming, graph)..."
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {Object.keys(groupedResults).length > 0 ? (
        Object.keys(groupedResults).map((source) => (
          <div key={source} className="results-section">
            <h3>
              <img
                src={sourceIcons[source]}
                alt={source}
                style={{ height: "20px", marginRight: "8px", verticalAlign: "middle" }}
              />
              {source} Problems
            </h3>
            <div className="results-grid">
              {groupedResults[source].map((question, index) => {
                const isSolved = solved.includes(question._id);

                return (
                  <div
                    key={index}
                    className={`question-card ${isSolved ? "solved" : ""}`}
                    onClick={() => handleSolve(question)}
                  >
                    <h4>
                      {question.title}
                      {isSolved && <span style={{ marginLeft: "8px", color: "green" }}>✔</span>}
                    </h4>
                    <span className={`badge ${question.difficulty?.toLowerCase() || "na"}`}>
                      {question.difficulty || "N/A"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        !loading && <p>No results found.</p>
      )}
    </div>
  );
};

export default Search;
