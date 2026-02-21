import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CPRsession from "./pages/CPRsession";
import Dashboard from "./pages/Dashboard";
import Results from "./pages/Results";
import "./App.css";



function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/session/:mode" element={<CPRsession />} />
      <Route path="/results" element={<Results />} />
    </Routes>
  );
}

export default App;