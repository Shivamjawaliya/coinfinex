import { useEffect, useRef, useState, useCallback } from "react";

export interface Candle {
  t: number;  // timestamp
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
}

interface UseWebSocketReturn {
  candles:     Candle[];
  livePrice:   number;
  isConnected: boolean;
  error:       string | null;
}

export function useWebSocket(symbol: string | null): UseWebSocketReturn {
  const [candles,     setCandles]     = useState<Candle[]>([]);
  const [livePrice,   setLivePrice]   = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error,       setError]       = useState<string | null>(null);

  const wsRef      = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const connect = useCallback(() => {
    if (!symbol) return;

    // Close existing connection
    wsRef.current?.close();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url      = `${protocol}//${window.location.host}?symbol=${symbol}`;
    const ws       = new WebSocket(url);
    wsRef.current  = ws;

    ws.onopen = () => {
      console.log(`🔌 WebSocket connected → ${symbol}`);
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "history") {
          // Full history received on connect
          setCandles(msg.candles || []);
          const last = msg.candles?.[msg.candles.length - 1];
          if (last) setLivePrice(last.c);

        } else if (msg.type === "candle" && msg.symbol === symbol) {
          const incoming: Candle = msg.candle;
          setLivePrice(incoming.c);

          setCandles((prev) => {
            if (msg.isNew) {
              // New minute — add new candle
              const updated = [...prev, incoming];
              // Keep max 390 candles
              return updated.length > 390 ? updated.slice(-390) : updated;
            } else {
              // Same minute — update last candle
              if (!prev.length) return [incoming];
              const updated = [...prev];
              updated[updated.length - 1] = incoming;
              return updated;
            }
          });
        }
      } catch (e) {
        console.error("WS message parse error:", e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.warn(`WS closed for ${symbol} — reconnecting in 3s`);
      reconnectRef.current = setTimeout(() => connect(), 3000);
    };

    ws.onerror = () => {
      setError(`WebSocket error for ${symbol}`);
      setIsConnected(false);
    };

  }, [symbol]);

  useEffect(() => {
    // Reset on symbol change
    setCandles([]);
    setLivePrice(0);
    setIsConnected(false);
    setError(null);
    clearTimeout(reconnectRef.current);

    connect();

    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { candles, livePrice, isConnected, error };
}