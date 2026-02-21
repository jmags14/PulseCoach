import { useEffect, useRef, useState, useCallback } from "react";

type WebSocketMessage = {
  type: string; // e.g., 'feedback', 'summary'
  text?: string;
  duckMusic?: boolean;
  highlightColor?: string;
  metrics?: any;
};

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  const sendMessage = useCallback((msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
    };

    wsRef.current.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch (e) {
        console.error("Invalid JSON:", event.data);
      }
    };

    return () => {
      wsRef.current?.close();
    };
  }, [url]);

  return { connected, messages, sendMessage };
}