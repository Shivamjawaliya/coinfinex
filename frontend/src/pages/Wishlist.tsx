import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWishlist, removeWishlist } from "../services/api";
import Sidebar from "../components/Sidebar";

export default function Wishlist() {
  const navigate = useNavigate();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWishlist()
      .then(r => setSymbols(r.data.wishlist))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const remove = async (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    setSymbols(prev => prev.filter(s => s !== symbol));
    try { await removeWishlist(symbol); } catch {
      setSymbols(prev => [...prev, symbol]);
    }
  };

  return (
    <>
      <div className="aurora"><div className="ab"/><div className="ab"/><div className="ab"/></div>
      <div className="grid-lines"/>
      <Sidebar active="wishlist"/>

      <div className="page-wrap">
        <div className="live-bar">
          <div className="live-dot"/><span className="live-text">♥</span>
          <span>Your Wishlist</span>
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
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
              {symbols.map(sym => (
                <div key={sym} onClick={() => navigate(`/stock/${sym}`)}
                  style={{ background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)", borderRadius:16, padding:"22px 20px", cursor:"pointer", position:"relative", transition:"transform 0.25s,border-color 0.25s,box-shadow 0.25s" }}
                  onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform="translateY(-4px)"; d.style.borderColor="rgba(0,245,196,0.25)"; d.style.boxShadow="0 16px 40px rgba(0,0,0,0.4)"; }}
                  onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform=""; d.style.borderColor="var(--border)"; d.style.boxShadow=""; }}
                >
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,var(--neon),transparent)", opacity:0.6, borderRadius:"16px 16px 0 0" }}/>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,var(--neon),var(--neon2))", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:"0.85rem", fontWeight:800, color:"#03040a" }}>
                      {sym.slice(0,2)}
                    </div>
                    <button onClick={e => remove(e, sym)}
                      style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1.2rem", color:"#ff4d6d", lineHeight:1, padding:"2px 4px", transition:"transform 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform="scale(1.25)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform=""; }}
                      title="Remove from wishlist">♥</button>
                  </div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1.1rem" }}>{sym}</div>
                  <div style={{ color:"var(--muted)", fontSize:"0.75rem", marginTop:4 }}>Click to view details</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
