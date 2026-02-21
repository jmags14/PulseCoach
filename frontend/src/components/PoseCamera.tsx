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

export default function PoseCamera({
  running,
  onPoseDetected,
  ready,
}: PoseCameraProps) {
  // References for video, canvas, pose model, animation frame, and media stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readyRef = useRef(ready);
  //store previous frame upper body for smoothing 
  const prevUpperBody = useRef<Array<{ x: number; y: number; z?: number }> | null>(null);


  // Load pose model once
  useEffect(() => {
    const loadModel = async () => {
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );
      //intialize the PoseLandMarker model
      poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(
        fileset,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        }
      );
    };

    loadModel();
  }, []);

  // React to running prop, starts/stops camera
  useEffect(() => {
    if (running) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [running]);

  useEffect(() => {
    readyRef.current = ready; // update ref whenever prop changes
  }, [ready]);

  const startCamera = async () => {
    if (!videoRef.current) return;
    //request access to webcam
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    videoRef.current.srcObject = streamRef.current;
    await videoRef.current.play();

    const canvas = canvasRef.current;
    if (canvas && videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
    }

    //start detecting poses
    detectPose();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    cancelAnimationFrame(animationRef.current!);
  };

  //main function for detecting poses and drawing skeletons
  const detectPose = async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !poseLandmarkerRef.current
    )
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    //draw skeleton
    const drawingUtils = new DrawingUtils(ctx);

    const upperBodyConnections: Connection[] = [
      { start: 11, end: 12 }, // shoulders
      { start: 11, end: 13 }, // left shoulder → left elbow
      { start: 13, end: 15 }, // left elbow → left wrist
      { start: 12, end: 14 }, // right shoulder → right elbow
      { start: 14, end: 16 }, // right elbow → right wrist
    ];

    const upperBodyIndexes = [11, 12, 13, 14, 15, 16];

    const renderLoop = async () => {
      const results = poseLandmarkerRef.current!.detectForVideo(video, performance.now());
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.landmarks.length > 0 && results.landmarks[0]) {
        const landmarks = results.landmarks[0]
        // Extract only upper body landmarks
        let upperBody = upperBodyIndexes.map((i) => results.landmarks[0][i]);

        // Smoothing with previous frame
        if (prevUpperBody.current) {
          for (let i = 0; i < upperBody.length; i++) {
            // Weighted average to smooth jitter
            upperBody[i].x = upperBody[i].x * 0.3 + prevUpperBody.current[i].x * 0.7;
            upperBody[i].y = upperBody[i].y * 0.3 + prevUpperBody.current[i].y * 0.7;
            if ("z" in upperBody[i] && "z" in prevUpperBody.current[i]) {
              upperBody[i].z = upperBody[i].z * 0.6 + prevUpperBody.current[i].z! * 0.4;
            }

            // Jump filtering to prevent sudden flips
            const MAX_JUMP = 0.2;
            const dx = upperBody[i].x - prevUpperBody.current[i].x;
            const dy = upperBody[i].y - prevUpperBody.current[i].y;
            if (Math.abs(dx) > MAX_JUMP || Math.abs(dy) > MAX_JUMP) {
              upperBody[i].x = prevUpperBody.current[i].x;
              upperBody[i].y = prevUpperBody.current[i].y;
            }
          }
        }

        // Update previous frame
        prevUpperBody.current = upperBody;

        // Draw only upper body
        drawingUtils.drawLandmarks(upperBody);
        // drawingUtils.drawLandmarks(landmarks)
        drawingUtils.drawConnectors(
          landmarks, 
          upperBodyConnections,
          {color: readyRef.current ? "lime" : "red", lineWidth: 3 }
        );
        //drawingUtils.drawConnectors(landmarks, POSE.connections);


        // Callback with upper body
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
      width: "80vw",
      height: "80vh",
      maxWidth: "900px",
      margin: "0 auto",
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
    />
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
      }}
    />
  </div>
);
}