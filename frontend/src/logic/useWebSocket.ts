import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

type ServerMessage = {
  type: string;
  text?: string;
  duckMusic?: boolean;
  highlightColor?: string;
  stats?: any;
};

export function useWebSocket(url: string) {
  const socketRef = useRef<Socket | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ServerMessage[]>([]);

  useEffect(() => {
    const socket = io(url);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
      setConnected(false);
    });

    // Unified AI response channel
    socket.on("ai_response", (data: ServerMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("summary", (data: ServerMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("voiceResponse", (data: any) => {
      if (!data.audio) return;

      if (typeof window !== "undefined" && window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel();
      }

      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      }

      const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
      activeAudioRef.current = audio;
      audio.onended = () => {
        if (activeAudioRef.current === audio) {
          activeAudioRef.current = null;
        }
      };

      audio.play().catch((err) => {
        console.error("voiceResponse playback error:", err);
      });
    });

    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current = null;
      }
      socket.disconnect();
    };
  }, [url]);

  const sendMessage = useCallback((event: string, payload: any) => {
    socketRef.current?.emit(event, payload);
  }, []);

  return { connected, messages, sendMessage };
}
