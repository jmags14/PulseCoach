type Landmark = { x: number; y: number; z?: number };

export type CPRMetrics = {
  bpm: number;
  relativeDepth: number;
  elbowsLocked: boolean;
  feedback: string;
};

export class CPREngine {
  private lastYPositions: number[] = [];
  private compressionTimestamps: number[] = [];
  private lastDirection: "up" | "down" | null = null;
  private lastCompressionTime = 0;
  private sessionStarted = false;


  processFrame(landmarks: Landmark[]): CPRMetrics | null {
    //engine won't count compression unill start session is one
    if (!this.sessionStarted) {
      if (this.isInStartPosition(landmarks)) {
        this.sessionStarted = true;
        return {
          bpm: 0,
          relativeDepth: 0,
          elbowsLocked: true,
          feedback: "Good position, start compressions",
        };
      } else {
        return {
          bpm: 0,
          relativeDepth: 0,
          elbowsLocked: false,
          feedback: "Get into proper position",
        };
      }
    }
    
    if (!landmarks || landmarks.length < 6) return null;

    const [lShoulder, rShoulder, lElbow, rElbow, lWrist, rWrist] = landmarks;

    //Shoulder midpoint
    const shoulderY = (lShoulder.y + rShoulder.y) / 2;

    this.lastYPositions.push(shoulderY);
    if (this.lastYPositions.length > 10) {
      this.lastYPositions.shift();
    }

    //Detect direction 
    if (this.lastYPositions.length >= 2) {
      const prev = this.lastYPositions[this.lastYPositions.length - 2];
      const curr = shoulderY;
      const direction = curr > prev ? "down" : "up";

      const MIN_RELATIVE_DEPTH = 0.02; // tune this
      const MIN_INTERVAL = 300; // ms (max ~200 BPM)

      if (this.lastYPositions.length >= 5) {
        const maxY = Math.max(...this.lastYPositions);
        const minY = Math.min(...this.lastYPositions);
        const rawDepth = maxY - minY;

        const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x);
        let relativeDepthForDetection = 0;

        if (shoulderWidth > 0) {
          relativeDepthForDetection = rawDepth / shoulderWidth;
        }
        const now = Date.now();

        if (
          this.lastDirection === "down" &&
          direction === "up" &&
          relativeDepthForDetection > MIN_RELATIVE_DEPTH &&
          now - this.lastCompressionTime > MIN_INTERVAL
        ) {
          this.compressionTimestamps.push(now);
          this.lastCompressionTime = now;
        }
      }

      this.lastDirection = direction;
    }

    //Keep only last 10 seconds 
    const now = Date.now();
    this.compressionTimestamps = this.compressionTimestamps.filter(
      (t) => now - t < 10000
    );

    const bpm = this.compressionTimestamps.length * 6;

    // Relative Depth calculation 
    //0.01 = shallow,   0.02 good,   0.03 deep
    // --- Normalized Relative Depth Calculation ---
    let relativeDepth = 0;

    if (this.lastYPositions.length > 0) {
      const maxY = Math.max(...this.lastYPositions);
      const minY = Math.min(...this.lastYPositions);
      const rawDepth = maxY - minY;

      // Use shoulder width as body-scale reference
      const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x);

      if (shoulderWidth > 0) {
        relativeDepth = rawDepth / shoulderWidth;
      }
    }

    // Elbow angle
    const elbowAngleLeft = this.getAngle(lShoulder, lElbow, lWrist);
    const elbowAngleRight = this.getAngle(rShoulder, rElbow, rWrist);
    const elbowsLocked = elbowAngleLeft > 160 && elbowAngleRight > 160;

    //Reset if no recent compressions (2s)
    if (
      this.compressionTimestamps.length === 0 ||
      now - this.compressionTimestamps[this.compressionTimestamps.length - 1] >
        3000
    ) {
      return {
        bpm: 0,
        relativeDepth ,
        elbowsLocked,
        feedback: "",
      };
    }

    //  Feedback
    let feedback = "Good compressions";

    if (bpm < 100) feedback = "Push faster";
    else if (bpm > 120) feedback = "Slow down";
    else if (!elbowsLocked) feedback = "Lock your elbows";
    else if (relativeDepth < 0.02) feedback = "Push deeper";

    return {
      bpm,
      relativeDepth ,
      elbowsLocked,
      feedback,
    };
  }

  private getAngle(a: Landmark, b: Landmark, c: Landmark) {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };

    const dot = ab.x * cb.x + ab.y * cb.y;
    const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
    const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);

    const angle = Math.acos(dot / (magAB * magCB));
    return (angle * 180) / Math.PI;
  }

  //if unit is in good form then can start
  public isInStartPosition(landmarks: Landmark[]): boolean {
    if (!landmarks || landmarks.length < 6) return false;

    const [lShoulder, rShoulder, lElbow, rElbow, lWrist, rWrist] = landmarks;

    const elbowsLocked = this.getAngle(lShoulder, lElbow, lWrist) > 160 &&
                        this.getAngle(rShoulder, rElbow, rWrist) > 160;

    // Hands roughly centered between shoulders
    const handsCentered = Math.abs(lWrist.x - rWrist.x) < 0.15 &&
                          Math.abs((lWrist.x + rWrist.x)/2 - (lShoulder.x + rShoulder.x)/2) < 0.08;
    //maybe can tweak the thresholds (0.1, 0.05, 160) based on testing.
    return elbowsLocked && handsCentered;
  }
  
}