import { useState } from "react";
import "../styles/SongCarousel.css";
import beatOnlyImg from "../assets/ticking.jpg";
import stayingAliveImg from "../assets/stayinalive.jpg";
import dancingQueenImg from "../assets/dancingqueen.png";
import crazyLoveImg from "../assets/crazyinlove.png";
import ruleWorldImg from "../assets/everybodywantstoruletheworld.jpg";
import expressoImg from "../assets/espresso.jpg";


// Song type
type Song = {
  id: string;
  name: string;
  artist: string;
  img: string;
};

type Props = {
  selected: string;
  onSelect: (id: string) => void;
};

const songs: Song[] = [
  { id: "beat_only", name: "Metronome Beat", artist: "", img: beatOnlyImg },
  { id: "staying_alive", name: "Stayin' Alive", artist: "Bee Gees", img: stayingAliveImg },
  { id: "dancing_queen", name: "Dancing Queen", artist: "ABBA", img: dancingQueenImg },
  { id: "crazy_love", name: "Crazy in Love", artist: "Beyoncé", img: crazyLoveImg },
  { id: "rule_world", name: "Everybody Wants to Rule the World", artist: "Tears for Fears", img: ruleWorldImg},
  { id: "espresso", name: "Espresso", artist: "Sabrina Carpenter", img: expressoImg},
];

export default function SongCarousel({ selected, onSelect }: Props) {
  const [centerIndex, setCenterIndex] = useState(
    songs.findIndex((s) => s.id === selected) || 0
  );

  const prev = () => {
    setCenterIndex((i) => (i === 0 ? songs.length - 1 : i - 1));
    onSelect(songs[centerIndex === 0 ? songs.length - 1 : centerIndex - 1].id);
  };

  const next = () => {
    setCenterIndex((i) => (i === songs.length - 1 ? 0 : i + 1));
    onSelect(songs[centerIndex === songs.length - 1 ? 0 : centerIndex + 1].id);
  };

  return (
    <div className="carousel-container">
      <button className="carousel-arrow left" onClick={prev}>
        ◀
      </button>

      <div className="carousel-cards">
        {songs.map((song, idx) => {
          let posClass: "left" | "center" | "right" | "hidden" = "hidden";
          if (idx === centerIndex) posClass = "center";
          else if (idx === (centerIndex - 1 + songs.length) % songs.length)
            posClass = "left";
          else if (idx === (centerIndex + 1) % songs.length) posClass = "right";

          return (
            <div
              key={song.id}
              className={`card ${posClass} ${selected === song.id ? "selected" : ""}`}
              onClick={() => onSelect(song.id)}
            >
              <img src={song.img} alt={song.name} />
              <div className="song-info">
                <div className="song-name">{song.name}</div>
                <div className="song-name">{song.artist}</div>

              </div>
            </div>
          );
        })}
      </div>

      <button className="carousel-arrow right" onClick={next}>
        ▶
      </button>
    </div>
  );
}