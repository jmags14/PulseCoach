type AudioCallbacks = {
  onTranscript: (text: string) => void;
};

export class AudioManager {
  private recognition: any = null;
  private listening = false;
  private callbacks: AudioCallbacks;

  constructor(callbacks: AudioCallbacks) {
    this.callbacks = callbacks;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn("SpeechRecognition not supported in this browser");
      return;
    }

    this.recognition = new SpeechRecognitionClass();
    this.recognition.lang = "en-US";
    this.recognition.interimResults = false;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.callbacks.onTranscript(transcript);
    };

    this.recognition.onend = () => {
      this.listening = false;
      this.callbacks.onTranscript?.("__END__");
    };
  }

  start() {
    if (!this.recognition || this.listening) return;

    this.listening = true;
    this.recognition.start();
  }

  stop() {
    if (!this.recognition) return;

    this.recognition.stop();
    window.speechSynthesis.cancel();
    this.listening = false;
  }

  speak(text: string) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }
}
