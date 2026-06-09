// import app from "./app";
// import { connectDB } from "./config/db";
// import { port } from "./config/keys";

// connectDB().then(() => {
//   app.listen(port, () => {
//     console.log(`🚀 Backend API running on http://localhost:${port}`);
//   });
// });
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import app from "./app";
import { connectDB } from "./config/db";
import { port, FINNHUB_KEY } from "./config/keys";
import { updateCandle, getCandleData } from "./utils/candleBuilder";
import { checkAndExecuteOrders, checkOrdersForSymbol } from "./utils/orderExecutor";

// ── HTTP server ──────────────────────────────────
const server = http.createServer(app);

// ── WebSocket server ─────────────────────────────
const wss = new WebSocketServer({ server });

// frontend clients grouped by symbol
const subscribers = new Map<string, Set<WebSocket>>();

wss.on("connection", (clientWs, req) => {
  const url    = new URL(req.url || "/", "http://localhost");
  const symbol = url.searchParams.get("symbol")?.toUpperCase();

  if (!symbol) { clientWs.close(); return; }

  console.log(`📱 Client subscribed → ${symbol}`);

  // Add to subscribers
  if (!subscribers.has(symbol)) subscribers.set(symbol, new Set());
  subscribers.get(symbol)!.add(clientWs);

  // Subscribe this symbol on Finnhub
  subscribeFinnhub(symbol);

  // Send existing candle history immediately
  const history = getCandleData(symbol);
  if (history.length) {
    clientWs.send(JSON.stringify({ type: "history", symbol, candles: history }));
  }

  clientWs.on("close", () => {
    subscribers.get(symbol)?.delete(clientWs);
    console.log(`📱 Client unsubscribed → ${symbol}`);
  });

  clientWs.on("error", (err) => {
    console.error(`Client WS error (${symbol}):`, err.message);
  });
});

// ── Broadcast to frontend clients ────────────────
export function broadcastCandle(sym: string, candle: object, isNew: boolean) {
  const clients = subscribers.get(sym);
  if (!clients?.size) return;
  const msg = JSON.stringify({ type: "candle", symbol: sym, candle, isNew });
  clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) c.send(msg);
  });
}

// ── Finnhub WebSocket ────────────────────────────
const subscribedSymbols = new Set<string>();
let finnhubWs: WebSocket;
let finnhubAuthFailed = false;

function connectFinnhub() {
  if (!FINNHUB_KEY) {
    console.warn("⚠️ FINNHUB_KEY not set — live ticks disabled, using Yahoo Finance polling only");
    return;
  }
  if (finnhubAuthFailed) return;

  finnhubWs = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_KEY}`);

  finnhubWs.on("open", () => {
    console.log("✅ Finnhub connected");
    subscribedSymbols.forEach((sym) => {
      finnhubWs.send(JSON.stringify({ type: "subscribe", symbol: sym }));
    });
  });

  finnhubWs.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type !== "trade") return;
      msg.data.forEach((trade: { s: string; p: number; v: number }) => {
        const { candle, isNew } = updateCandle(trade.s, trade.p, trade.v || 0);
        broadcastCandle(trade.s, candle, isNew);
        checkOrdersForSymbol(trade.s, trade.p);
      });
    } catch (e) { console.error("Finnhub parse error:", e); }
  });

  finnhubWs.on("close", () => {
    if (finnhubAuthFailed) return;
    console.warn("⚠️ Finnhub disconnected — reconnecting in 3s");
    setTimeout(connectFinnhub, 3000);
  });

  finnhubWs.on("error", (err) => {
    if (err.message.includes("401")) {
      finnhubAuthFailed = true;
      console.warn("⚠️ Finnhub auth failed (401) — invalid API key. Live ticks disabled; Yahoo Finance polling will handle order execution.");
    } else {
      console.error("Finnhub error:", err.message);
    }
  });
}

function subscribeFinnhub(symbol: string) {
  if (subscribedSymbols.has(symbol)) return;
  subscribedSymbols.add(symbol);
  if (finnhubWs?.readyState === WebSocket.OPEN) {
    finnhubWs.send(JSON.stringify({ type: "subscribe", symbol }));
    console.log(`📡 Finnhub subscribed → ${symbol}`);
  }
}

// ── Start ────────────────────────────────────────
connectDB().then(() => {
  connectFinnhub();
  checkAndExecuteOrders();
  setInterval(checkAndExecuteOrders, 2 * 60 * 1000);
  console.log("📊 Order executor started — every 2 min");
  server.listen(port, () => {
    console.log(`🚀 Server → http://localhost:${port}`);
    console.log(`🔌 WebSocket ready`);
  });
});