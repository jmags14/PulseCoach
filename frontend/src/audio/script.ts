// ===== CPR METRONOME LOGIC FOR REACT =====

// Create audio context (browser audio system)
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

let interval: number | null = null;

export function playClick() {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = "square";        // sharp click sound
  oscillator.frequency.value = 1000; // pitch in Hz

  gainNode.gain.value = 0.2;         // volume

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.05);
}

export function startMetronome(bpm: number = 110) {
  stopMetronome(); // avoid duplicates

  interval = window.setInterval(() => {  // window.setInterval is safer for TS
    playClick();
  }, 60000 / bpm);
}

export function stopMetronome() {
  if (interval !== null) {
    clearInterval(interval); // works with number
    interval = null;
  }
}