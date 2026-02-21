import "../styles/Home.css";
import { useNavigate } from "react-router-dom";
import Waveform from "../components/Waveform";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <Waveform />
      <button
        className="start-btn"
        onClick={() => navigate("/dashboard")}
      >
        Start
      </button>
    </div>
  );
}

export default Home
