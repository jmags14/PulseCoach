import { useEffect, useRef } from "react";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

type PoseCameraProps = {
  running: boolean;
  onPoseDetected?: (landmarks: any[]) => void;
  ready?: boolean;
};

type Connection = { start: number; end: number };

export default function PoseCamera({ running, onPoseDetected, ready }: PoseCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readyRef = useRef(ready);
  const prevUpperBody = useRef<Array<{ x: number; y: number; z?: number }> | null>(null);

  // Load model once
  useEffect(() => {
    const loadModel = async () => {
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );
      poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
    };
    loadModel();
  }, []);

  useEffect(() => {
    if (running) startCamera();
    else stopCamera();
  }, [running]);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  // KEY FIX: compute the actual rendered video rect within the container.
  // Because we use objectFit: "contain", the video is letterboxed inside the
  // canvas element. Landmarks are in [0,1] normalized coords relative to the
  // video frame — we must remap them to the letterboxed area, not the full canvas.
  const getVideoRect = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return { x: 0, y: 0, w: canvas?.width ?? 0, h: canvas?.height ?? 0 };

    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = canvas.width / canvas.height;

    let w: number, h: number, x: number, y: number;

    if (videoAspect > canvasAspect) {
      // Video is wider — pillarbox (bars on top/bottom)
      w = canvas.width;
      h = canvas.width / videoAspect;
      x = 0;
      y = (canvas.height - h) / 2;
    } else {
      // Video is taller — letterbox (bars on left/right)
      h = canvas.height;
      w = canvas.height * videoAspect;
      x = (canvas.width - w) / 2;
      y = 0;
    }

    return { x, y, w, h };
  };

  const startCamera = async () => {
    if (!videoRef.current) return;
    streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = streamRef.current;

    // Wait for video metadata so we have real dimensions
    await new Promise<void>((resolve) => {
      videoRef.current!.onloadedmetadata = () => resolve();
    });
    await videoRef.current.play();

    // Set canvas to match the container (not the raw video size)
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    detectPose();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    prevUpperBody.current = null;
  };

  const detectPose = () => {
    if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const upperBodyConnections: Connection[] = [
      { start: 11, end: 12 },
      { start: 11, end: 13 },
      { start: 13, end: 15 },
      { start: 12, end: 14 },
      { start: 14, end: 16 },
    ];
    const upperBodyIndexes = [11, 12, 13, 14, 15, 16];

    const renderLoop = () => {
      const results = poseLandmarkerRef.current!.detectForVideo(video, performance.now());
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.landmarks.length > 0 && results.landmarks[0]) {
        const landmarks = results.landmarks[0];
        let upperBody = upperBodyIndexes.map((i) => ({ ...landmarks[i] }));

        // Smoothing
        if (prevUpperBody.current) {
          for (let i = 0; i < upperBody.length; i++) {
            upperBody[i].x = upperBody[i].x * 0.3 + prevUpperBody.current[i].x * 0.7;
            upperBody[i].y = upperBody[i].y * 0.3 + prevUpperBody.current[i].y * 0.7;
            if ("z" in upperBody[i] && "z" in prevUpperBody.current[i]) {
              upperBody[i].z = upperBody[i].z * 0.6 + prevUpperBody.current[i].z! * 0.4;
            }
            const MAX_JUMP = 0.2;
            const dx = upperBody[i].x - prevUpperBody.current[i].x;
            const dy = upperBody[i].y - prevUpperBody.current[i].y;
            if (Math.abs(dx) > MAX_JUMP || Math.abs(dy) > MAX_JUMP) {
              upperBody[i].x = prevUpperBody.current[i].x;
              upperBody[i].y = prevUpperBody.current[i].y;
            }
          }
        }
        prevUpperBody.current = upperBody;

        // KEY FIX: remap normalized [0,1] coords → actual pixel coords within
        // the letterboxed/pillarboxed video rect inside the canvas.
        const { x: vx, y: vy, w: vw, h: vh } = getVideoRect();

        const remapped = upperBody.map((lm) => ({
          ...lm,
          x: (lm.x * vw + vx) / canvas.width,
          y: (lm.y * vh + vy) / canvas.height,
        }));

        // For connectors we need full landmarks array remapped too
        const remappedFull = landmarks.map((lm) => ({
          ...lm,
          x: (lm.x * vw + vx) / canvas.width,
          y: (lm.y * vh + vy) / canvas.height,
        }));

        const drawingUtils = new DrawingUtils(ctx);
        drawingUtils.drawLandmarks(remapped);
        drawingUtils.drawConnectors(remappedFull, upperBodyConnections, {
          color: readyRef.current ? "lime" : "red",
          lineWidth: 3,
        });

        onPoseDetected?.(upperBody);
      }

      animationRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}