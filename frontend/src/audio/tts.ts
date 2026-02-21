const steps: string[] = [
  "Welcome to the CPR training demo. Let's learn the basics of chest compressions.",
  "First, check the pulse at the neck using two fingers gently on the side of the windpipe.",
  "If there is no pulse, kneel beside the person's chest on a firm, flat surface.",
  "Place the heel of one hand in the center of the chest.",
  "Place your other hand on top, fingers interlocked around the bottom hand, keeping fingers off the chest.",
  "Keep your arms straight and shoulders directly over your hands to push efficiently.",
  "Push hard and fast, about two inches deep, at a steady rhythm.",
  "Allow the chest to fully rise back up between compressions.",
  "Maintain a steady pace, around 100 to 120 compressions per minute.",
  "Keep your posture correct, arms straight, and hands in the right place throughout.",
  "This concludes the basic CPR compression tutorial. Now let's practice!"
];

let currentStep = 0;
let paused = false;
let utterance: SpeechSynthesisUtterance | null = null;

// ===== Speak a step =====
function speakStep(updateCaption: (text: string) => void) {
  if (currentStep >= steps.length) return;

  const text = steps[currentStep];
  updateCaption(text);

  utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.8;
  utterance.pitch = 6;

  utterance.onend = () => {
    if (!paused) {
      currentStep++;
      speakStep(updateCaption);
    }
  };

  speechSynthesis.speak(utterance);
}

// ===== CONTROLS =====
export function startTutorial(updateCaption: (text: string) => void) {
  speechSynthesis.cancel(); // reset any current speech
  paused = false;
  currentStep = 0;
  speakStep(updateCaption);
}

export function pauseTutorial() {
  speechSynthesis.pause();
  paused = true;
}

export function resumeTutorial() {
  speechSynthesis.resume();
  paused = false;
}

export function replayTutorial(updateCaption: (text: string) => void) {
  startTutorial(updateCaption);
}