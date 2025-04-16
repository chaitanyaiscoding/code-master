import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
      setResults(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch problems. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Updated: passing full question object via state
  const handleSolve = (question) => {
    navigate(`/solve/${question._id}`, { state: { question } });
  };

  const groupedResults = results.reduce((acc, question) => {
    acc[question.source] = acc[question.source] || [];
    acc[question.source].push(question);
    return acc;
  }, {});

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Search Problems from LeetCode, CodeChef & Codeforces</h2>
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter topic..."
        style={{ padding: "8px", marginRight: "10px", borderRadius: "5px" }}
      />
      <button onClick={handleSearch} disabled={loading} style={{ padding: "8px 12px", cursor: "pointer" }}>
        {loading ? "Searching..." : "Search"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {Object.keys(groupedResults).length > 0 ? (
        Object.keys(groupedResults).map((source) => (
          <div key={source} style={{ marginTop: "20px" }}>
            <h3>{source} Problems</h3>
            <ul>
              {groupedResults[source].map((question, index) => (
                <li key={index}>
                  <span
                    onClick={() => handleSolve(question)}
                    style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
                  >
                    {question.title} - {question.difficulty}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        !loading && <p>No results found.</p>
      )}
    </div>
  );
};

export default Search;
