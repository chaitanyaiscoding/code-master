import React, { useState } from "react";
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
  const navigate = useNavigate();

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
          placeholder="Enter topic (e.g., DP, graph)..."
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
              {groupedResults[source].map((question, index) => (
                <div
                  key={index}
                  className="question-card"
                  onClick={() => handleSolve(question)}
                >
                  <h4>{question.title}</h4>
                  <span className={`badge ${question.difficulty?.toLowerCase() || "na"}`}>
                    {question.difficulty || "N/A"}
                  </span>
                </div>
              ))}
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
