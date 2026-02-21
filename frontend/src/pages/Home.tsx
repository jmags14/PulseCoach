//import "../style/Home.css";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <button
    
        onClick={() => navigate("/cprsession")}
      >
        Start
      </button>
    </div>
  );
}

export default Home