import { useEffect, useState } from "react";
import { getTransactions } from "../services/api";
import Sidebar from "../components/Sidebar";

interface Transaction {
  _id: string;
  stockname: string;
  orderType: "buy" | "sell";
  quantity: number;
  executedPrice: number;
  executedAt: string;
  targetPrice: number;
}

export default function Transactions() {
  const [txns, setTxns]     = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactions()
      .then(r => setTxns(r.data.transactions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

  return (
    <>
      <div className="aurora"><div className="ab"/><div className="ab"/><div className="ab"/></div>
      <div className="grid-lines"/>
      <Sidebar active="transactions"/>

      <div className="page-wrap">
        <div className="live-bar">
          <div className="live-dot"/><span className="live-text">🧾</span>
          <span>Transaction History</span>
        </div>

        <div style={{ padding:"32px 36px 60px", position:"relative", zIndex:1 }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"2rem", fontWeight:800, marginBottom:8 }}>Transactions</h1>
          <p style={{ color:"var(--muted)", marginBottom:32 }}>All your executed orders</p>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner"/></div>
          ) : txns.length === 0 ? (
            <div style={{ textAlign:"center", padding:"80px 0", color:"var(--muted)" }}>
              <div style={{ fontSize:"3rem", marginBottom:16 }}>🧾</div>
              <p style={{ fontSize:"1rem" }}>No transactions yet.</p>
            </div>
          ) : (
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid var(--border)", borderRadius:16, overflow:"hidden" }}>
              {/* Header */}
              <div style={{ display:"grid", gridTemplateColumns:"1.4fr 0.7fr 0.7fr 0.7fr 0.9fr 0.9fr 1fr", gap:12, padding:"14px 20px", borderBottom:"1px solid var(--border)", background:"rgba(255,255,255,0.03)" }}>
                {["Date","Stock","Type","Qty","Buy Price","Sell Price","P&L"].map(h => (
                  <span key={h} style={{ fontSize:"0.7rem", color:"var(--muted)", letterSpacing:"1px", textTransform:"uppercase", fontWeight:600 }}>{h}</span>
                ))}
              </div>

              {txns.map((t, i) => {
                const isBuy = t.orderType === "buy";
                // old sell records have targetPrice = executedPrice (sell price stored in both fields)
                // new records have targetPrice = buy price, executedPrice = actual sell price
                const hasRealPnl = !isBuy && t.executedPrice !== t.targetPrice;
                const pnl    = isBuy
                  ? -(t.executedPrice * t.quantity)
                  : (t.executedPrice - t.targetPrice) * t.quantity;
                const pnlPos = pnl >= 0;
                return (
                  <div key={t._id}
                    style={{ display:"grid", gridTemplateColumns:"1.4fr 0.7fr 0.7fr 0.7fr 0.9fr 0.9fr 1fr", gap:12, padding:"16px 20px", borderBottom: i < txns.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems:"center", transition:"background 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.025)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background=""; }}
                  >
                    <span style={{ fontSize:"0.82rem", color:"var(--muted)" }}>{fmtDate(t.executedAt)}</span>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"0.92rem" }}>{t.stockname}</span>
                    <span style={{ padding:"3px 10px", marginRight:"20px", borderRadius:6, fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", textAlign:"center",
                      background: isBuy ? "rgba(0,230,118,0.1)" : "rgba(255,77,109,0.1)",
                      color:       isBuy ? "#00e676"             : "#ff4d6d",
                      border:     `1px solid ${isBuy ? "rgba(0,230,118,0.25)" : "rgba(255,77,109,0.25)"}` }}>
                      {t.orderType}
                    </span>
                    <span style={{ fontSize:"0.9rem", fontWeight:600 }}>{t.quantity}</span>
                    {/* Buy Price */}
                    <span style={{ fontSize:"0.9rem", fontWeight:600, color:"var(--muted)" }}>${t.targetPrice.toFixed(2)}</span>
                    {/* Sell Price — "—" for BUY; for old SELL records where both prices equal, show "—" */}
                    <span style={{ fontSize:"0.9rem", fontWeight:600, color:"var(--neon)" }}>
                      {isBuy || !hasRealPnl ? "—" : `$${t.executedPrice.toFixed(2)}`}
                    </span>
                    {/* P&L: buy = not applicable yet; sell = price diff × qty; old records = "—" */}
                    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"0.95rem",
                      color: hasRealPnl ? (pnlPos ? "#00e676" : "#ff4d6d") : "var(--muted)" }}>
                      {hasRealPnl
                        ? `${pnlPos?"+":"-"}$${Math.abs(pnl).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`
                        : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
