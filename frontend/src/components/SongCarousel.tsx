import "../styles/SongCarousel.css";

const songs = [
  { id: "staying_alive", name: "Stayin' Alive" },
  { id: "another_one", name: "Another One Bites the Dust" },
  { id: "beat_only", name: "Metronome Beat" },
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
        </div>
      ))}
    </div>
  );
}

export default SongCarousel;