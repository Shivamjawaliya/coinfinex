import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWishlist, removeWishlist, getStockPrice } from "../services/api";
import Sidebar from "../components/Sidebar";

const STOCK_META: Record<string, { name: string; logoA: string; logoB: string; initials: string }> = {
  AAPL:  { name:"Apple Inc",              logoA:"#555",    logoB:"#aaa",    initials:"AA" },
  MSFT:  { name:"Microsoft Corp",         logoA:"#00A4EF", logoB:"#7FBA00", initials:"MS" },
  NVDA:  { name:"NVIDIA Corp",            logoA:"#76B900", logoB:"#004600", initials:"NV" },
  GOOGL: { name:"Alphabet Inc",           logoA:"#4285F4", logoB:"#EA4335", initials:"GO" },
  META:  { name:"Meta Platforms",         logoA:"#0081FB", logoB:"#00C6FF", initials:"ME" },
  TSLA:  { name:"Tesla Inc",              logoA:"#CC0000", logoB:"#FF4444", initials:"TS" },
  AMZN:  { name:"Amazon.com Inc",         logoA:"#FF9900", logoB:"#232F3E", initials:"AM" },
  AMD:   { name:"Advanced Micro Devices", logoA:"#ED1C24", logoB:"#FF6B6B", initials:"AM" },
  ORCL:  { name:"Oracle Corp",            logoA:"#F80000", logoB:"#CC0000", initials:"OR" },
  NFLX:  { name:"Netflix Inc",            logoA:"#E50914", logoB:"#221F1F", initials:"NF" },
  JPM:   { name:"JPMorgan Chase",         logoA:"#003087", logoB:"#0062CC", initials:"JP" },
  BAC:   { name:"Bank of America",        logoA:"#E31837", logoB:"#012169", initials:"BA" },
  JNJ:   { name:"Johnson & Johnson",      logoA:"#CC0000", logoB:"#990000", initials:"JN" },
  PFE:   { name:"Pfizer Inc",             logoA:"#00559F", logoB:"#003A6C", initials:"PF" },
  WMT:   { name:"Walmart Inc",            logoA:"#0071CE", logoB:"#FFC220", initials:"WM" },
  KO:    { name:"Coca-Cola Co",           logoA:"#F40009", logoB:"#CC0000", initials:"KO" },
  XOM:   { name:"ExxonMobil",             logoA:"#FF0000", logoB:"#CC0000", initials:"XO" },
  BTC:   { name:"Bitcoin",                logoA:"#F7931A", logoB:"#FF6B00", initials:"BT" },
  ETH:   { name:"Ethereum",               logoA:"#627EEA", logoB:"#8A92B2", initials:"ET" },
};

function getMeta(sym: string) {
  return STOCK_META[sym] ?? { name: sym, logoA: "var(--neon)", logoB: "var(--neon2)", initials: sym.slice(0,2) };
}

function Row({ label, value, big, neon, small, color, last }: {
  label: string; value: string;
  big?: boolean; neon?: boolean; small?: boolean; color?: string; last?: boolean;
}) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:`${big?"10px":"7px"} 0`, borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize:"0.7rem", color:"var(--muted)", letterSpacing:"0.04em" }}>{label}</span>
      <span style={{ fontSize: big?"1.05rem":small?"0.75rem":"0.88rem", fontWeight: big?800:600, color: neon?"var(--neon)":color||"var(--text)", fontFamily: big?"'Syne',sans-serif":"inherit" }}>{value}</span>
    </div>
  );
}

interface StockCard { symbol: string; price: number; change: number; }

export default function Wishlist() {
  const navigate = useNavigate();
  const [symbols, setSymbols]   = useState<string[]>([]);
  const [prices, setPrices]     = useState<Record<string, StockCard>>({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getWishlist()
      .then(r => {
        const syms: string[] = r.data.wishlist;
        setSymbols(syms);
        syms.forEach((sym, i) => {
          setTimeout(() => {
            getStockPrice(sym)
              .then(pr => {
                if (pr.data.success) {
                  setPrices(prev => ({ ...prev, [sym]: { symbol: sym, price: pr.data.price, change: pr.data.change ?? 0 } }));
                }
              })
              .catch(() => {});
          }, i * 400);
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const remove = async (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    setSymbols(prev => prev.filter(s => s !== symbol));
    try { await removeWishlist(symbol); } catch {
      setSymbols(prev => [symbol, ...prev]);
    }
  };

  const fmt = (usd: number) => "₹" + (usd * 83.5).toLocaleString("en-IN", { minimumFractionDigits:2, maximumFractionDigits:2 });

  return (
    <>
      <div className="aurora"><div className="ab"/><div className="ab"/><div className="ab"/></div>
      <div className="grid-lines"/>
      <Sidebar active="wishlist"/>

      <div className="page-wrap">
        <div className="live-bar">
          <div className="live-dot"/><span className="live-text">Live</span>
          <span>Wishlist · live prices</span>
        </div>

        <div style={{ padding:"32px 36px 60px", position:"relative", zIndex:1 }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"2rem", fontWeight:800, marginBottom:8 }}>Wishlist</h1>
          <p style={{ color:"var(--muted)", marginBottom:32 }}>Stocks you're watching</p>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner"/></div>
          ) : symbols.length === 0 ? (
            <div style={{ textAlign:"center", padding:"80px 0", color:"var(--muted)" }}>
              <div style={{ fontSize:"3rem", marginBottom:16 }}>♡</div>
              <p style={{ fontSize:"1rem" }}>No stocks in your wishlist yet.</p>
              <button onClick={() => navigate("/explore")}
                style={{ marginTop:20, padding:"10px 24px", borderRadius:10, background:"rgba(0,245,196,0.1)", border:"1px solid rgba(0,245,196,0.3)", color:"var(--neon)", cursor:"pointer", fontSize:"0.9rem", fontWeight:600 }}>
                Explore Stocks
              </button>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
              {symbols.map(sym => {
                const meta = getMeta(sym);
                const p    = prices[sym];
                const price  = p?.price ?? 0;
                const change = p?.change ?? 0;
                const isUp   = change >= 0;
                const open   = price > 0 ? price / (1 + change / 100) : 0;
                const low    = open * 0.995;
                const high   = price * 1.005;

                return (
                  <div key={sym} onClick={() => navigate(`/stock/${sym}`)}
                    style={{ background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)", borderRadius:18, padding:22, cursor:"pointer", position:"relative", overflow:"hidden", transition:"transform 0.3s,border-color 0.3s,box-shadow 0.3s" }}
                    onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform="translateY(-4px)"; d.style.borderColor="rgba(0,245,196,0.25)"; d.style.boxShadow="0 20px 50px rgba(0,0,0,0.5)"; }}
                    onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform=""; d.style.borderColor="var(--border)"; d.style.boxShadow=""; }}
                  >
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${meta.logoA},transparent)`, opacity:0.7 }}/>

                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${meta.logoA},${meta.logoB})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", fontWeight:800, color:"#fff", flexShrink:0, letterSpacing:"-0.5px", textShadow:"0 1px 2px rgba(0,0,0,0.5)" }}>
                        {meta.initials}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"0.98rem" }}>{sym}</div>
                        <div style={{ color:"var(--muted)", fontSize:"0.7rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{meta.name.toUpperCase()}</div>
                      </div>
                      <button onClick={e => remove(e, sym)}
                        style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1.1rem", color:"#ff4d6d", lineHeight:1, padding:"2px 4px", transition:"transform 0.15s", flexShrink:0 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform="scale(1.25)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform=""; }}
                        title="Remove from wishlist">♥</button>
                    </div>

                    <Row label="Price"      value={price > 0 ? fmt(price) : "Loading…"} big neon />
                    <Row label="Change"     value={price > 0 ? `${isUp?"+":""}${change.toFixed(2)}%` : "—"} color={isUp?"#4ade80":"var(--neon3)"} />
                    <Row label="Day Range"  value={price > 0 ? `${fmt(low)} – ${fmt(high)}` : "—"} small />
                    <Row label="Open"       value={price > 0 ? fmt(open) : "—"} />
                    <Row label="Prev Close" value={price > 0 ? fmt(open) : "—"} last />
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
