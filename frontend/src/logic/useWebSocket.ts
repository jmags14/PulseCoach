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

    return () => {
      socket.disconnect();
    };
  }, [url]);

  const sendMessage = useCallback((event: string, payload: any) => {
    socketRef.current?.emit(event, payload);
  }, []);

  return { connected, messages, sendMessage };
}
