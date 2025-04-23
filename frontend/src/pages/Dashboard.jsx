import React from 'react';
import WeakTopicPredictor from '../components/WeakTopicPredictor';
import './Dashboard.css'; // Make sure this file exists in the same folder

function Dashboard() {
  const email = "hh"; // Replace this with actual logged-in user email

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">👋 Welcome to Your Dashboard</h1>

      <div className="dashboard-card">
        <h2 className="dashboard-subtitle">🔍 Your Weakest Topics</h2>
        <WeakTopicPredictor email={email} />
      </div>
    </div>
  );
}

export default Dashboard;
