import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Search from "./components/Search";
import Compiler from "./components/Compiler";
import Signup from "./components/Signup";
import Login from "./components/Login";

function App() {
  return (
    <Router>
      <div>
        <h1>Competitive Programming Search</h1>
        <nav>
          <Link to="/">Home</Link> |{" "}
          <Link to="/login">Login</Link> |{" "}
          <Link to="/signup">Signup</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/solve/:questionId" element={<Compiler />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
