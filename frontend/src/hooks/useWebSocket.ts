import { useEffect, useRef, useState } from "react";

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
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

  const wsRef         = useRef<WebSocket | null>(null);
  const reconnectRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef    = useRef<boolean>(true);
  const symbolRef     = useRef<string | null>(symbol);

  useEffect(() => {
    symbolRef.current = symbol;
  }, [symbol]);

  useEffect(() => {
    mountedRef.current = true;

    if (!symbol) return;

    // Reset state
    setCandles([]);
    setLivePrice(0);
    setIsConnected(false);
    setError(null);

    function connect() {
      // Don't connect if unmounted or symbol changed
      if (!mountedRef.current) return;
      if (symbolRef.current !== symbol) return;

      // Close existing
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on manual close
        wsRef.current.close();
        wsRef.current = null;
      }

      const apiUrl      = import.meta.env.VITE_API_URL as string | undefined;
      const backendHost = import.meta.env.VITE_BACKEND_WS_URL
        || (apiUrl ? apiUrl.replace(/^http/, "ws") : "ws://localhost:5001");
      const url         = `${backendHost}?symbol=${symbol}`;

      console.log(`🔌 Connecting to ${url}`);
      const ws      = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log(`✅ WS connected → ${symbol}`);
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "history") {
            const hist: Candle[] = msg.candles || [];
            setCandles(hist);
            const last = hist[hist.length - 1];
            if (last) setLivePrice(last.c);

          } else if (msg.type === "candle" && msg.symbol === symbol) {
            const incoming: Candle = msg.candle;
            setLivePrice(incoming.c);

            setCandles((prev) => {
              if (msg.isNew) {
                const updated = [...prev, incoming];
                return updated.length > 390 ? updated.slice(-390) : updated;
              } else {
                if (!prev.length) return [incoming];
                const updated = [...prev];
                updated[updated.length - 1] = incoming;
                return updated;
              }
            });
          }
        } catch (e) {
          console.error("WS parse error:", e);
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        if (symbolRef.current !== symbol) return; // symbol changed — don't reconnect
        console.warn(`⚠️ WS closed → ${symbol}, reconnecting in 5s`);
        setIsConnected(false);
        // Reconnect after 5 seconds
        reconnectRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setError(`Connection error for ${symbol}`);
        setIsConnected(false);
      };
    }

    // Small delay to avoid StrictMode double-mount race
    const initTimer = setTimeout(connect, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      clearTimeout(reconnectRef.current);
      // Clean close without triggering reconnect
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbol]);

  return { candles, livePrice, isConnected, error };
}