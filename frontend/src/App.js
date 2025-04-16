import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Search from "./components/Search";
import Compiler from "./components/Compiler";

function App() {
  return (
    <Router>
      <div>
        <h1>Competitive Programming Search</h1>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/solve/:questionId" element={<Compiler />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
