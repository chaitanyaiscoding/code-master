import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Search from "./components/Search";
import Compiler from "./components/Compiler";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import "./App.css"; // Keep your custom styles
function App() {
  return (
    <Router>
      <div>
        <header style={headerStyle}>
          <h1 style={titleStyle}>CODE MASTER</h1>
          <nav style={navStyle}>
            <Link to="/signup" style={linkStyle}>Signup</Link>
            <span style={separator}>|</span>
            <Link to="/login" style={linkStyle}>Login</Link>
            <span style={separator}>|</span>
            <Link to="/" style={linkStyle}>Home</Link>
            <span style={separator}>|</span>
            <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
          </nav>
        </header>
        <main style={{ padding: "30px 40px" }}>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Search />} />
            <Route path="/solve/:questionId" element={<Compiler />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

const headerStyle = {
  backgroundColor: "#ffffff",
  padding: "20px 40px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
};

const titleStyle = {
  fontSize: "2rem",
  fontWeight: "bold",
  margin: "0 0 10px 0",
  color: "#2c3e50",
};

const navStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  alignItems: "center",
};

const linkStyle = {
  textDecoration: "none",
  color: "#2d79c7",
  fontWeight: "500",
};

const separator = {
  color: "#666",
};

export default App;
