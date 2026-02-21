import "../styles/SongCarousel.css";

const songs = [
  { id: "staying_alive", name: "Stayin' Alive", artist: "Bees Gees" },
  { id: "dancing_queen", name: "Dancing Queen", artist: "ABBA" },
  { id: "crazy_love", name: "Crazy in Love", artist: "Carly Rae Jepsen" },
  { id: "rule_world", name: "Everybody Wants to Rule the World", artist: "Tears for Fears" },
  { id: "espresso", name: "Espresso", artist: "Sabrina Carpenter" },
  { id: "beat_only", name: "Metronome Beat", artist: "" },
];

type Props = {
  selected: string;
  onSelect: (id: string) => void;
};

function SongCarousel({ selected, onSelect }: Props) {
  return (
    <div className="carousel-container">
      {songs.map((song) => (
        <div
          key={song.id}
          className={`song-card ${
            selected === song.id ? "active" : ""
          }`}
          onClick={() => onSelect(song.id)}
        >
          {song.name} 
          <br />
          {song.artist}
        </div>
      ))}
    </div>
  );
}

export default SongCarousel;