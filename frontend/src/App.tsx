import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CPRsession from "./pages/CPRsession";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cprsession" element={<CPRsession />} />
    </Routes>
  );
}

export default App;