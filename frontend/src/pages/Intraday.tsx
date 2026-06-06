import { useState, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import CandleChart from "../components/CandleChart";
import Sidebar from "../components/Sidebar";

const STOCKS = [
  { sym: "AAPL", name: "Apple Inc" },
  { sym: "MSFT", name: "Microsoft Corp" },
  { sym: "GOOGL", name: "Alphabet Inc" },
  { sym: "NVDA", name: "NVIDIA Corp" },
  { sym: "TSLA", name: "Tesla Inc" },
  { sym: "META", name: "Meta Platforms" },
  { sym: "AMZN", name: "Amazon.com" },
  { sym: "JPM",  name: "JPMorgan Chase" },
  { sym: "V",    name: "Visa Inc" },
  { sym: "WMT",  name: "Walmart Inc" },
  { sym: "GS",   name: "Goldman Sachs" },
  { sym: "NFLX", name: "Netflix Inc" },
  { sym: "RIVN", name: "Rivian" },
  { sym: "UBER", name: "Uber Technologies" },
  { sym: "ADBE", name: "Adobe Inc" },
];

interface Order {
  _id:         string;
  stockname:   string;
  orderType:   "buy" | "sell";
  targetPrice: number;
  quantity:    number;
  status:      string;
  createdAt:   string;
}

export default function Intraday() {
  const [search,      setSearch]      = useState("");
  const [dropdown,    setDropdown]    = useState(false);
  const [symbol,      setSymbol]      = useState<string | null>(null);
  const [chips,       setChips]       = useState<string[]>([]);
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [buyQty,      setBuyQty]      = useState(1);
  const [buyType,     setBuyType]     = useState<"buy" | "sell">("buy");
  const [schedQty,    setSchedQty]    = useState(1);
  const [schedType,   setSchedType]   = useState<"buy" | "sell">("buy");
  const [schedTarget, setSchedTarget] = useState("");
  const [notif,       setNotif]       = useState<{ msg: string; type: string } | null>(null);

  // WebSocket hook — connects to server for live candles
  const { candles, livePrice, isConnected, error } = useWebSocket(symbol);

  // Load orders on mount
  useEffect(() => { loadOrders(); }, []);

  // Auto-dismiss notification
  useEffect(() => {
    if (!notif) return;
    const t = setTimeout(() => setNotif(null), 3500);
    return () => clearTimeout(t);
  }, [notif]);

  function showNotif(msg: string, type = "success") {
    setNotif({ msg, type });
  }

  // ── Search ────────────────────────────────────
  const filtered = STOCKS.filter(
    (s) =>
      s.sym.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 6);

  function selectStock(sym: string) {
    setSearch("");
    setDropdown(false);
    if (!chips.includes(sym)) setChips((prev) => [...prev, sym]);
    setSymbol(sym);
  }

  function removeChip(sym: string) {
    setChips((prev) => prev.filter((s) => s !== sym));
    if (symbol === sym) setSymbol(chips.find((s) => s !== sym) || null);
  }

  // ── Stats from candles ────────────────────────
  const firstCandle  = candles[0];
  const change       = firstCandle ? livePrice - firstCandle.o : 0;
  const changePct    = firstCandle ? ((change / firstCandle.o) * 100).toFixed(2) : "0.00";
  const dayHigh      = candles.length ? Math.max(...candles.map((c) => c.h)) : 0;
  const dayLow       = candles.length ? Math.min(...candles.map((c) => c.l)) : 0;
  const totalVolume  = candles.reduce((s, c) => s + c.v, 0);
  const isUp         = change >= 0;

  // ── Buy now ───────────────────────────────────
  async function executeBuy() {
    if (!symbol)    { showNotif("Select a stock first", "error"); return; }
    if (!livePrice) { showNotif("No live price available", "error"); return; }

    try {
      const url  = buyType === "buy" ? "/api/buy-stock" : "/api/sell-stock";
      const body = buyType === "buy"
        ? { stockname: symbol, stockquantity: buyQty, stockbuyprice: livePrice }
        : { stockname: symbol, stockquantity: buyQty };

      const r = await fetch(url, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(body),
      });
      const d = await r.json();
      showNotif(
        d.success
          ? `✓ ${buyType === "buy" ? "Bought" : "Sold"} ${buyQty} ${symbol} @ $${livePrice.toFixed(2)}`
          : d.message || "Failed",
        d.success ? "success" : "error"
      );
    } catch {
      showNotif("Network error", "error");
    }
  }

  // ── Schedule trade ────────────────────────────
  async function placeOrder() {
    if (!symbol)      { showNotif("Select a stock first", "error"); return; }
    if (!schedTarget) { showNotif("Enter target price", "error");   return; }

    try {
      const r = await fetch("/api/place-order", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          stockname:   symbol,
          orderType:   schedType,
          targetPrice: parseFloat(schedTarget),
          quantity:    schedQty,
        }),
      });
      const d = await r.json();
      showNotif(
        d.success
          ? `✓ Order placed — ${schedType.toUpperCase()} ${schedQty} ${symbol} @ $${schedTarget}`
          : d.message || "Failed",
        d.success ? "success" : "error"
      );
      if (d.success) loadOrders();
    } catch {
      showNotif("Network error", "error");
    }
  }

  async function loadOrders() {
    try {
      const r = await fetch("/api/my-orders", { credentials: "include" });
      const d = await r.json();
      setOrders(d.orders || []);
    } catch { /* silent */ }
  }

  async function cancelOrder(id: string) {
    try {
      const r = await fetch(`/api/cancel-order/${id}`, {
        method: "POST", credentials: "include",
      });
      const d = await r.json();
      showNotif(d.success ? "Order cancelled" : "Failed", d.success ? "success" : "error");
      if (d.success) loadOrders();
    } catch {
      showNotif("Network error", "error");
    }
  }

  // ── Target price difference ───────────────────
  const targetNum  = parseFloat(schedTarget);
  const targetDiff = livePrice && targetNum
    ? (targetNum - livePrice).toFixed(2)
    : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#03040a", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, marginLeft: "240px" }}>

        {/* Topbar */}
        <div style={{ position: "sticky", top: 0, zIndex: 40, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 32px", background: "rgba(3,4,10,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.25rem", fontWeight: 800 }}>Intraday Trading</h1>
            <p style={{ fontSize: "0.8rem", color: "rgba(240,240,240,0.5)", marginTop: 2 }}>Live candlestick · Buy now · Schedule trades</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(0,245,196,0.08)", border: "1px solid rgba(0,245,196,0.2)", borderRadius: 8, fontSize: "0.75rem", color: "#00f5c4", fontWeight: 600 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: isConnected ? "#00f5c4" : "#ff6b6b", boxShadow: isConnected ? "0 0 6px #00f5c4" : "none" }} />
              {isConnected ? "Live" : "Connecting..."}
            </div>
          </div>
        </div>

        <div style={{ padding: "28px 32px 60px" }}>

          {/* ── Search ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,240,240,0.5)", marginBottom: 10 }}>
              Select Stock
            </div>
            <div style={{ position: "relative", maxWidth: 380 }}>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setDropdown(true); }}
                onFocus={() => setDropdown(true)}
                onBlur={() => setTimeout(() => setDropdown(false), 150)}
                placeholder="Search — AAPL, TSLA, NVDA..."
                style={{ width: "100%", background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 11, padding: "11px 14px", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none" }}
              />
              {/* Dropdown */}
              {dropdown && search && filtered.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, zIndex: 100, boxShadow: "0 20px 50px rgba(0,0,0,0.6)", overflow: "hidden" }}>
                  {filtered.map((s) => (
                    <div
                      key={s.sym}
                      onMouseDown={() => selectStock(s.sym)}
                      style={{ padding: "11px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 12, alignItems: "center" }}
                    >
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#00f5c4", fontSize: "0.9rem" }}>{s.sym}</div>
                      <div style={{ fontSize: "0.78rem", color: "rgba(240,240,240,0.5)" }}>{s.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chips */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              {chips.map((sym) => (
                <div
                  key={sym}
                  onClick={() => setSymbol(sym)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: symbol === sym ? "rgba(0,245,196,0.18)" : "rgba(0,245,196,0.08)", border: `1px solid ${symbol === sym ? "#00f5c4" : "rgba(0,245,196,0.25)"}`, borderRadius: 8, cursor: "pointer" }}
                >
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#00f5c4", fontSize: "0.85rem" }}>{sym}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeChip(sym); }} style={{ background: "none", border: "none", color: "rgba(240,240,240,0.5)", cursor: "pointer", fontSize: "0.9rem", lineHeight: 1 }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Stats Bar ── */}
          {symbol && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Symbol",    value: symbol,                                  color: "#00f5c4" },
                { label: "Price",     value: livePrice ? `$${livePrice.toFixed(2)}` : "—", color: "#00f5c4" },
                { label: "Change",    value: `${isUp ? "+" : ""}${changePct}%`,       color: isUp ? "#00e676" : "#ff6b6b" },
                { label: "Day High",  value: dayHigh ? `$${dayHigh.toFixed(2)}` : "—", color: "#00e676" },
                { label: "Day Low",   value: dayLow  ? `$${dayLow.toFixed(2)}`  : "—", color: "#ff6b6b" },
                { label: "Volume",    value: totalVolume > 1e6 ? `${(totalVolume/1e6).toFixed(1)}M` : totalVolume.toLocaleString(), color: "#f0f0f0" },
              ].map((s) => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,240,240,0.5)", marginBottom: 5 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Candlestick Chart ── */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.4rem", fontWeight: 800 }}>
                    {symbol || "Select a stock"}
                  </span>
                  {livePrice > 0 && (
                    <>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#00f5c4" }}>
                        ${livePrice.toFixed(2)}
                      </span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: isUp ? "#00e676" : "#ff6b6b" }}>
                        {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)} ({changePct}%)
                      </span>
                    </>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(240,240,240,0.4)", marginTop: 4 }}>
                  {isConnected ? `⚡ Live WebSocket · ${candles.length} candles` : error || "Connecting..."}
                </div>
              </div>
            </div>

            <CandleChart candles={candles} symbol={symbol || ""} height={420} />
          </div>

          {/* ── Trade Panels ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

            {/* Buy Now */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 24 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 800, marginBottom: 4 }}>🟢 Buy / Sell Now</div>
              <div style={{ fontSize: "0.78rem", color: "rgba(240,240,240,0.5)", marginBottom: 20 }}>Market order at current live price</div>

              {/* Symbol display */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,240,240,0.5)", marginBottom: 6 }}>Stock</div>
                <div style={{ padding: "11px 14px", background: "rgba(0,0,0,0.4)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", color: "#00f5c4", fontWeight: 700 }}>
                  {symbol || "—"}
                </div>
              </div>

              {/* Order type */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,240,240,0.5)", marginBottom: 6 }}>Order Type</div>
                <select value={buyType} onChange={(e) => setBuyType(e.target.value as "buy" | "sell")}
                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 14px", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none", appearance: "none" }}>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>

              {/* Quantity */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,240,240,0.5)", marginBottom: 6 }}>Quantity</div>
                <input type="number" min={1} value={buyQty} onChange={(e) => setBuyQty(parseInt(e.target.value) || 1)}
                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 14px", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none" }} />
              </div>

              {/* Order summary */}
              <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                {[
                  { label: "Price/share", value: livePrice ? `$${livePrice.toFixed(2)}` : "—" },
                  { label: "Quantity",    value: buyQty },
                  { label: "Total",       value: livePrice ? `$${(livePrice * buyQty).toFixed(2)}` : "—", bold: true, color: "#00f5c4" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "0.82rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ color: "rgba(240,240,240,0.5)" }}>{row.label}</span>
                    <span style={{ fontWeight: row.bold ? 700 : 600, color: row.color || "#f0f0f0" }}>{String(row.value)}</span>
                  </div>
                ))}
              </div>

              <button onClick={executeBuy}
                style={{ width: "100%", padding: 13, border: "none", borderRadius: 11, background: buyType === "buy" ? "linear-gradient(135deg,#00f5c4,#00b894)" : "linear-gradient(135deg,#ff6b6b,#c0392b)", color: buyType === "buy" ? "#03040a" : "white", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", fontWeight: 800, cursor: "pointer" }}>
                {buyType === "buy" ? `✓ Buy ${buyQty} shares` : `✓ Sell ${buyQty} shares`}
              </button>
            </div>

            {/* Schedule Trade */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 24 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 800, marginBottom: 4 }}>🕐 Schedule Trade</div>
              <div style={{ fontSize: "0.78rem", color: "rgba(240,240,240,0.5)", marginBottom: 20 }}>Auto-executes when target price is hit</div>

              {/* Stock display */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,240,240,0.5)", marginBottom: 6 }}>Stock</div>
                <div style={{ padding: "11px 14px", background: "rgba(0,0,0,0.4)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", color: "#7b61ff", fontWeight: 700 }}>
                  {symbol || "—"}
                </div>
              </div>

              {/* Order type */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,240,240,0.5)", marginBottom: 6 }}>Order Type</div>
                <select value={schedType} onChange={(e) => setSchedType(e.target.value as "buy" | "sell")}
                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 14px", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none", appearance: "none" }}>
                  <option value="buy">Buy when price drops to...</option>
                  <option value="sell">Sell when price rises to...</option>
                </select>
              </div>

              {/* Target price */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,240,240,0.5)", marginBottom: 6 }}>Target Price ($)</div>
                <input type="number" min={0} step={0.01} value={schedTarget} onChange={(e) => setSchedTarget(e.target.value)} placeholder="e.g. 200.00"
                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 14px", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none" }} />
              </div>

              {/* Quantity */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,240,240,0.5)", marginBottom: 6 }}>Quantity</div>
                <input type="number" min={1} value={schedQty} onChange={(e) => setSchedQty(parseInt(e.target.value) || 1)}
                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 14px", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none" }} />
              </div>

              {/* Summary */}
              <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                {[
                  { label: "Current Price", value: livePrice ? `$${livePrice.toFixed(2)}` : "—", color: "#00f5c4" },
                  { label: "Your Target",   value: schedTarget ? `$${schedTarget}` : "—" },
                  { label: "Difference",    value: targetDiff ? `${parseFloat(targetDiff) >= 0 ? "+" : ""}$${targetDiff}` : "—", color: parseFloat(targetDiff || "0") >= 0 ? "#00e676" : "#ff6b6b" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "0.82rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ color: "rgba(240,240,240,0.5)" }}>{row.label}</span>
                    <span style={{ fontWeight: 600, color: row.color || "#f0f0f0" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <button onClick={placeOrder}
                style={{ width: "100%", padding: 13, border: "none", borderRadius: 11, background: "linear-gradient(135deg,#7b61ff,#5f3dc4)", color: "white", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", fontWeight: 800, cursor: "pointer" }}>
                📋 Place Limit Order
              </button>
            </div>
          </div>

          {/* ── Orders Table ── */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 800 }}>Scheduled Orders</div>
                <div style={{ fontSize: "0.78rem", color: "rgba(240,240,240,0.5)", marginTop: 2 }}>Auto-execute when target price is hit</div>
              </div>
              <button onClick={loadOrders}
                style={{ padding: "6px 14px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, background: "transparent", color: "rgba(240,240,240,0.5)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", cursor: "pointer" }}>
                ↻ Refresh
              </button>
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "rgba(240,240,240,0.4)" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>📋</div>
                <div>No orders yet</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
                <thead>
                  <tr>
                    {["Symbol","Type","Target","Qty","Status","Created","Action"].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,240,240,0.5)", borderBottom: "1px solid rgba(255,255,255,0.07)", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td style={{ padding: "12px", fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#00f5c4" }}>{o.stockname}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ padding: "2px 9px", borderRadius: 999, background: o.orderType === "buy" ? "rgba(0,230,118,0.1)" : "rgba(255,107,107,0.1)", color: o.orderType === "buy" ? "#00e676" : "#ff6b6b", fontSize: "0.7rem", fontWeight: 700 }}>
                          {o.orderType.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontWeight: 600 }}>${o.targetPrice}</td>
                      <td style={{ padding: "12px" }}>{o.quantity}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ padding: "2px 9px", borderRadius: 999, background: o.status === "executed" ? "rgba(0,245,196,0.12)" : o.status === "pending" ? "rgba(255,184,0,0.12)" : "rgba(255,255,255,0.06)", color: o.status === "executed" ? "#00f5c4" : o.status === "pending" ? "#ffb800" : "#94a3b8", fontSize: "0.7rem", fontWeight: 700 }}>
                          {o.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: "0.75rem", color: "rgba(240,240,240,0.5)" }}>
                        {new Date(o.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {o.status === "pending" && (
                          <button onClick={() => cancelOrder(o._id)}
                            style={{ padding: "4px 10px", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 6, background: "rgba(255,107,107,0.08)", color: "#ff6b6b", fontSize: "0.72rem", cursor: "pointer" }}>
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>

      {/* Notification */}
      {notif && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", padding: "12px 22px", borderRadius: 12, fontWeight: 700, zIndex: 99999, fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", whiteSpace: "nowrap", background: notif.type === "success" ? "linear-gradient(135deg,rgba(0,245,196,0.92),rgba(0,200,150,0.92))" : "linear-gradient(135deg,rgba(255,77,109,0.92),rgba(123,97,255,0.92))", color: notif.type === "success" ? "#03040a" : "white" }}>
          {notif.msg}
        </div>
      )}
    </div>
  );
}