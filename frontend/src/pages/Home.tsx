import "../styles/Home.css";
import { useNavigate } from "react-router-dom";
import Waveform from "../components/Waveform";
import Button3D from "../components/3dbutton";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <Waveform />
      <Button3D
        onClick={() => navigate("/dashboard")}
      >
        Start
      </Button3D>
    </div>
  );
}

export default Home
