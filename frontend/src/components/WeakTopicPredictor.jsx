import React from 'react';
import './WeakTopicPredictor.css'; 

const WeakTopicPredictor = ({ email }) => {
  // Example data – replace with actual logic
  const weakTopics = [
    {
      topic: "Dynamic Programming",
      solved: 2,
      suggestions: ["Greedy", "Memoization", "Recursion"]
    },
    {
      topic: "Arrays",
      solved: 3,
      suggestions: []
    }
  ];

  return (
    <div className="topic-list">
      {weakTopics.map((topic, index) => (
        <div className="topic-card" key={index}>
          <div className="topic-header">
            <span className="topic-icon">📌</span>
            <h3>{topic.topic}</h3>
            <span className="solved-count">Solved: {topic.solved}</span>
          </div>
          {topic.suggestions.length > 0 && (
            <p className="suggestions">
              <strong>Suggested next topics:</strong>{" "}
              {topic.suggestions.join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default WeakTopicPredictor;
