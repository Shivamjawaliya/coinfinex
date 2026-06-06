import { useEffect, useRef, useState, useCallback } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { getTrading, buyStock, sellStock, resetPortfolio, getStockPrice } from "../services/api";
import Sidebar from "../components/Sidebar";
import type { PortfolioItem, PortfolioData, AssetDistribution } from "../types";

ChartJS.register(ArcElement, Tooltip, Legend);

/* ── Asset lists ───────────────────────────────────────── */
const STOCKS = [
  {sym:"AAPL",name:"Apple Inc.",       type:"stock"},
  {sym:"MSFT",name:"Microsoft Corp.",  type:"stock"},
  {sym:"GOOGL",name:"Alphabet Inc.",   type:"stock"},
  {sym:"NVDA",name:"NVIDIA Corp.",     type:"stock"},
  {sym:"TSLA",name:"Tesla Inc.",       type:"stock"},
  {sym:"META",name:"Meta Platforms",   type:"stock"},
  {sym:"AMZN",name:"Amazon.com",       type:"stock"},
  {sym:"JPM", name:"JPMorgan Chase",   type:"stock"},
  {sym:"V",   name:"Visa Inc.",        type:"stock"},
  {sym:"WMT", name:"Walmart Inc.",     type:"stock"},
  {sym:"GS",  name:"Goldman Sachs",    type:"stock"},
  {sym:"IBM", name:"IBM Corp.",        type:"stock"},
  {sym:"NFLX",name:"Netflix Inc.",     type:"stock"},
  {sym:"DIS", name:"Walt Disney Co.",  type:"stock"},
  {sym:"BAC", name:"Bank of America",  type:"stock"},
  {sym:"AMD", name:"Advanced Micro",   type:"stock"},
  {sym:"ORCL",name:"Oracle Corp.",     type:"stock"},
  {sym:"CRM", name:"Salesforce Inc.",  type:"stock"},
];
const CRYPTOS = [
  {sym:"BTC", name:"Bitcoin",      type:"crypto"},
  {sym:"ETH", name:"Ethereum",     type:"crypto"},
  {sym:"BNB", name:"Binance Coin", type:"crypto"},
  {sym:"SOL", name:"Solana",       type:"crypto"},
  {sym:"XRP", name:"XRP",          type:"crypto"},
  {sym:"ADA", name:"Cardano",      type:"crypto"},
  {sym:"AVAX",name:"Avalanche",    type:"crypto"},
  {sym:"DOGE",name:"Dogecoin",     type:"crypto"},
];

const PALETTE = ["#00f5c4","#7b61ff","#ff6b6b","#ffb800","#00e676","#38bdf8"];

interface RecentActivity { stockname: string; stockquantity: number; stockbuyprice: number; }

/* ── Notification ──────────────────────────────────────── */
function Notif({ msg, type }: { msg: string; type: "success"|"error" }) {
  return (
    <div style={{ position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",padding:"13px 22px",borderRadius:13,fontWeight:700,zIndex:99999,pointerEvents:"none",whiteSpace:"nowrap",fontSize:"0.88rem",
      background: type==="success" ? "linear-gradient(135deg,rgba(0,245,196,.92),rgba(0,200,150,.92))" : "linear-gradient(135deg,rgba(255,77,109,.92),rgba(123,97,255,.92))",
      color: type==="success" ? "#03040a" : "white",
      boxShadow:"0 8px 24px rgba(0,0,0,.4)",
    }}>{msg}</div>
  );
}

/* ── Main component ────────────────────────────────────── */
export default function VirtualTrading() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const [data, setData]           = useState<PortfolioData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [livePrices, setLivePrices] = useState<Record<string,number>>({});
  const [notif, setNotif]         = useState<{msg:string;type:"success"|"error"}|null>(null);

  /* modal state */
  const [showModal, setShowModal]   = useState(false);
  const [tradeMode, setTradeMode]   = useState<"buy"|"sell">("buy");
  const [assetMode, setAssetMode]   = useState<"stock"|"crypto">("stock");
  const [selSym, setSelSym]         = useState("");
  const [livePrice, setLivePrice]   = useState(0);
  const [priceFetching, setPriceFetching] = useState(false);
  const [qty, setQty]               = useState(1);
  const [searchQ, setSearchQ]       = useState("");
  const [showResults, setShowResults] = useState(false);

  /* sell-from-table modal */
  const [sellModal, setSellModal]   = useState<PortfolioItem|null>(null);
  const [sellQty, setSellQty]       = useState(1);

  /* ── load portfolio ─────────────────────────────────── */
  const load = useCallback(() => {
    setLoading(true);
    getTrading()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── poll live prices for holdings ─────────────────── */
  useEffect(() => {
    if (!data?.portfolio.length) return;
    const syms = data.portfolio.map(p => p.stockname);
    const poll = setInterval(async () => {
      const prices: Record<string,number> = {};
      await Promise.allSettled(syms.map(s =>
        getStockPrice(s).then(r => { if (r.data.success) prices[s]=r.data.price; })
      ));
      setLivePrices(prev => ({...prev,...prices}));
    }, 15000);
    return () => clearInterval(poll);
  }, [data]);

  /* ── toast helper ───────────────────────────────────── */
  const toast = (msg: string, type: "success"|"error") => {
    setNotif({msg,type});
    setTimeout(() => setNotif(null), 2500);
  };

  /* ── particle canvas ────────────────────────────────── */
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;
    let W=0,H=0,raf=0,mx=-9999,my=-9999;
    const resize = () => { W=cv.width=window.innerWidth; H=cv.height=window.innerHeight; };
    resize(); window.addEventListener("resize",resize);
    const PAL=["#00f5c4","#7b61ff","#ff6b6b"];
    const pts = Array.from({length:80}, () => ({
      x:Math.random()*window.innerWidth, y:Math.random()*window.innerHeight,
      r:Math.random()*1.3+.3, vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3,
      a:Math.random()*.28+.06, col:PAL[Math.floor(Math.random()*PAL.length)],
    }));
    const onM=(e:MouseEvent)=>{mx=e.clientX;my=e.clientY;};
    window.addEventListener("mousemove",onM);
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y);
        if(d<100){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle="#00f5c4";ctx.globalAlpha=(1-d/100)*.045;ctx.lineWidth=.5;ctx.stroke();}
      }
      pts.forEach(p=>{
        const dx=p.x-mx,dy=p.y-my,d=Math.hypot(dx,dy);
        if(d<110){const f=((110-d)/110)*.4;p.vx+=(dx/d)*f;p.vy+=(dy/d)*f;}
        p.vx*=.983;p.vy*=.983;p.x+=p.vx;p.y+=p.vy;
        if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.globalAlpha=p.a;ctx.fillStyle=p.col;ctx.fill();
      });
      ctx.globalAlpha=1; raf=requestAnimationFrame(draw);
    };
    draw();
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);window.removeEventListener("mousemove",onM);};
  },[]);

  /* ── fetch live price for modal ─────────────────────── */
  const fetchPrice = useCallback(async (sym: string) => {
    if (!sym) return;
    setPriceFetching(true); setLivePrice(0);
    try {
      const r = await getStockPrice(sym);
      if (r.data.success && r.data.price > 0) setLivePrice(r.data.price);
    } catch {}
    setPriceFetching(false);
  }, []);

  const selectAsset = (sym: string) => {
    setSelSym(sym); setSearchQ(sym); setShowResults(false);
    fetchPrice(sym);
  };

  /* ── confirm buy ────────────────────────────────────── */
  const confirmBuy = async () => {
    if (!selSym || !livePrice) return;
    try {
      await buyStock(selSym, qty, livePrice);
      setShowModal(false);
      toast(`✓ Bought ${qty} × ${selSym}`, "success");
      load();
    } catch { toast("Trade failed", "error"); }
  };

  /* ── confirm sell from modal ────────────────────────── */
  const confirmSell = async () => {
    if (!selSym || !livePrice) return;
    try {
      await sellStock(selSym, qty);
      setShowModal(false);
      toast(`✓ Sold ${qty} × ${selSym}`, "success");
      load();
    } catch { toast("Sell failed","error"); }
  };

  /* ── sell from table ────────────────────────────────── */
  const confirmTableSell = async () => {
    if (!sellModal) return;
    try {
      await sellStock(sellModal.stockname, sellQty);
      setSellModal(null);
      toast(`✓ Sold ${sellQty} × ${sellModal.stockname}`, "success");
      load();
    } catch { toast("Sell failed","error"); }
  };

  /* ── reset ──────────────────────────────────────────── */
  const handleReset = async () => {
    if (!confirm("Reset entire portfolio? This cannot be undone.")) return;
    await resetPortfolio();
    toast("Portfolio reset", "success");
    load();
  };

  /* ── filtered asset list ────────────────────────────── */
  const assetList = assetMode === "stock" ? STOCKS : CRYPTOS;
  const filtered  = assetList.filter(a =>
    !searchQ || a.sym.toUpperCase().includes(searchQ.toUpperCase()) || a.name.toUpperCase().includes(searchQ.toUpperCase())
  );

  /* ── chart data ─────────────────────────────────────── */
  const dist: AssetDistribution[] = data?.assetDistribution ?? [];
  const chartData = {
    labels: dist.map(d => d.name),
    datasets:[{ data:dist.map(d=>d.value), backgroundColor:PALETTE, borderColor:"rgba(0,0,0,0)", hoverOffset:8, borderRadius:4 }],
  };
  const chartOptions = {
    responsive:true, maintainAspectRatio:false, cutout:"68%",
    plugins:{
      legend:{ labels:{ color:"rgba(240,240,240,.7)", font:{family:"DM Sans", size:11}, padding:14 }},
      tooltip:{ backgroundColor:"#0c1220", borderColor:"rgba(255,255,255,.1)", borderWidth:1, titleColor:"#00f5c4", bodyColor:"#f0f0f0", padding:11 },
    },
  };

  const isProfit = (data?.totalProfit ?? 0) >= 0;
  const total    = qty * livePrice;

  /* ── JSX ────────────────────────────────────────────── */
  return (
    <>
      <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>
      <div className="aurora"><div className="ab"/><div className="ab"/><div className="ab"/></div>
      <div className="grid-lines"/>
      <Sidebar active="virtual-trading"/>

      {notif && <Notif msg={notif.msg} type={notif.type}/>}

      <div className="page-wrap">
        <div className="live-bar">
          <div className="live-dot"/><span className="live-text">Live</span>
          <span>Virtual trading with real-time market prices</span>
        </div>
        <div className="topbar">
          <div><h1>Virtual Trading</h1><p>Trade with real data, no real money</p></div>
        </div>

        <div className="page-content" style={{paddingTop:24}}>

          {/* Banner */}
          <div style={{background:"linear-gradient(135deg,rgba(0,245,196,.06),rgba(123,97,255,.06))",border:"1px solid rgba(0,245,196,.18)",borderRadius:20,padding:"20px 28px",marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 10% 50%,rgba(0,245,196,.04),transparent 60%)",pointerEvents:"none"}}/>
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.15rem",fontWeight:800,background:"linear-gradient(135deg,var(--text),var(--neon))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Virtual Trading Practice Mode</div>
              <div style={{fontSize:"0.85rem",color:"var(--muted)",marginTop:4}}>Trade with real-time market data using virtual money. No real money involved.</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:10,background:"rgba(0,245,196,.08)",border:"1px solid rgba(0,245,196,.25)",fontSize:"0.8rem",color:"var(--neon)",fontWeight:600}}>
              <div className="live-dot"/> Live Market Data
            </div>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="spinner-wrap"><div className="spinner"/></div>
          ) : (
            <>
              <div className="grid-4" style={{marginBottom:24}}>
                {[
                  {icon:"💼",label:"Total Value",    val:`$${(data?.totalPortfolioValue??0).toFixed(2)}`,  sub:"Portfolio market value",color:"var(--neon)"},
                  {icon:isProfit?"📈":"📉",label:"Total P/L",val:`${isProfit?"+":""}$${(data?.totalProfit??0).toFixed(2)}`,sub:"Unrealised gain / loss",color:isProfit?"#00e676":"var(--neon3)"},
                  {icon:"🎯",label:"Return %",       val:`${isProfit?"+":""}${data?.totalProfitPercent??0}%`,sub:"Overall return",color:isProfit?"#00e676":"var(--neon3)"},
                  {icon:"🏦",label:"Holdings",       val:String(data?.portfolio.length??0),sub:"Open positions",color:"var(--neon2)"},
                ].map((s,i) => (
                  <div key={i} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:20,padding:24,position:"relative",overflow:"hidden",transition:"transform .3s,border-color .3s"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-4px)";(e.currentTarget as HTMLDivElement).style.borderColor="rgba(0,245,196,.22)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="";(e.currentTarget as HTMLDivElement).style.borderColor="var(--border)";}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,var(--neon),var(--neon2))"}}/>
                    <div style={{width:40,height:40,borderRadius:10,background:"rgba(0,245,196,.1)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,fontSize:"1.1rem"}}>{s.icon}</div>
                    <div style={{fontSize:"0.68rem",letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)",marginBottom:8}}>{s.label}</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.8rem",fontWeight:800,lineHeight:1,color:s.color}}>{s.val}</div>
                    <div style={{fontSize:"0.75rem",color:"var(--muted)",marginTop:5}}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Two-column layout */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20,alignItems:"start"}}>

                {/* LEFT */}
                <div style={{display:"flex",flexDirection:"column",gap:20}}>

                  {/* ── TRADE ACTION CARD ──────────────────── */}
                  <div style={{background:"linear-gradient(135deg,rgba(123,97,255,0.12),rgba(0,245,196,0.07))",border:"1px solid rgba(123,97,255,0.3)",borderRadius:20,padding:"28px 28px",position:"relative",overflow:"hidden"}}>
                    {/* top accent */}
                    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,var(--neon2),var(--neon))"}}/>
                    {/* glow */}
                    <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(123,97,255,0.18),transparent 70%)",filter:"blur(20px)",pointerEvents:"none"}}/>

                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:20,flexWrap:"wrap",position:"relative"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,var(--neon2),var(--neon))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",flexShrink:0}}>⚡</div>
                          <div>
                            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.1rem",fontWeight:800}}>Execute Virtual Trade</div>
                            <div style={{fontSize:"0.78rem",color:"var(--muted)",marginTop:2}}>Buy &amp; sell with real market prices, zero risk</div>
                          </div>
                        </div>

                        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:16}}>
                          <button
                            onClick={() => { setShowModal(true); setTradeMode("buy"); setAssetMode("stock"); setSelSym(""); setSearchQ(""); setLivePrice(0); setQty(1); }}
                            style={{display:"flex",alignItems:"center",gap:8,padding:"12px 26px",background:"linear-gradient(135deg,var(--neon),var(--neon2))",color:"#03040a",border:"none",borderRadius:12,fontWeight:800,fontSize:"0.88rem",cursor:"pointer",transition:"all 0.25s",letterSpacing:"0.3px",boxShadow:"0 4px 20px rgba(0,245,196,0.2)"}}
                            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLButtonElement).style.boxShadow="0 10px 30px rgba(0,245,196,0.3)";}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.transform="";(e.currentTarget as HTMLButtonElement).style.boxShadow="0 4px 20px rgba(0,245,196,0.2)";}}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                            Start Trading
                          </button>
                          <button
                            onClick={handleReset}
                            style={{display:"flex",alignItems:"center",gap:8,padding:"12px 22px",background:"rgba(255,107,107,0.08)",border:"1px solid rgba(255,107,107,0.3)",color:"var(--neon3)",borderRadius:12,fontWeight:700,fontSize:"0.85rem",cursor:"pointer",transition:"all 0.25s"}}
                            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,107,107,0.18)";(e.currentTarget as HTMLButtonElement).style.transform="translateY(-2px)";}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,107,107,0.08)";(e.currentTarget as HTMLButtonElement).style.transform="";}}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.28"/></svg>
                            Reset Portfolio
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Holdings table */}
                  <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:20,padding:24}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.05rem",fontWeight:800}}>Your Holdings</div>
                      {(data?.portfolio.length??0)>0 && <span style={{fontSize:"0.75rem",color:"var(--muted)",background:"rgba(255,255,255,.05)",border:"1px solid var(--border)",padding:"3px 11px",borderRadius:999}}>{data?.portfolio.length} positions</span>}
                    </div>

                    {!data?.portfolio.length ? (
                      <div style={{textAlign:"center",padding:"40px 20px",color:"var(--muted)"}}>
                        <div style={{fontSize:"2.2rem",marginBottom:10,opacity:.5}}>📂</div>
                        <div style={{fontSize:"0.9rem"}}>No holdings yet. Click Start Trading to begin.</div>
                      </div>
                    ) : (
                      <div style={{overflowX:"auto"}}>
                        <table className="data-table">
                          <thead><tr><th>Asset</th><th>Qty</th><th>Avg Price</th><th>Current</th><th>Value</th><th>P/L</th><th>Action</th></tr></thead>
                          <tbody>
                            {data.portfolio.map((item,i) => {
                              const c   = PALETTE[i%PALETTE.length];
                              const cur = livePrices[item.stockname] ?? item.currentPrice;
                              const val = cur * item.quantity;
                              const pnl = val - item.invested;
                              const up  = pnl >= 0;
                              return (
                                <tr key={item.stockname}>
                                  <td>
                                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                                      <a href={`/stock/${item.stockname}`} rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:10}}>
                                      <div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${c},${c}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontSize:"0.68rem",fontWeight:800,color:"#03040a",flexShrink:0}}>
                                        {item.stockname.slice(0,2).toUpperCase()}
                                      </div>
                                      </a>

                                      <div>
                                        <div style={{fontFamily:"'Syne',sans-serif",fontSize:"0.88rem",fontWeight:800}}>{item.stockname}</div>
                                        <span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:"0.65rem",fontWeight:700,background:"rgba(0,245,196,.12)",color:"var(--neon)",border:"1px solid rgba(0,245,196,.2)"}}>stock</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{fontWeight:600}}>{item.quantity}</td>
                                  <td>${item.buyPrice.toFixed(2)}</td>
                                  <td style={{color:"var(--neon)",fontWeight:600}}>${cur.toFixed(2)}</td>
                                  <td style={{fontWeight:600}}>${val.toFixed(2)}</td>
                                  <td>
                                    <div style={{color:up?"#00e676":"var(--neon3)",fontWeight:700}}>{up?"+":""} ${pnl.toFixed(2)}</div>
                                    <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:999,fontSize:"0.72rem",fontWeight:700,background:up?"rgba(0,230,118,.12)":"rgba(255,107,107,.12)",color:up?"#00e676":"var(--neon3)"}}>
                                      {up?"▲":"▼"} {item.profitPercent}%
                                    </span>
                                  </td>
                                  <td>
                                    <button onClick={() => { setSellModal(item); setSellQty(1); }}
                                      style={{padding:"7px 14px",border:"1px solid rgba(255,77,109,.35)",borderRadius:9,background:"rgba(255,77,109,.1)",color:"var(--neon3)",fontFamily:"'DM Sans',sans-serif",fontSize:"0.75rem",fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}
                                      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,77,109,.22)";}}
                                      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,77,109,.1)";}}>
                                      Sell
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:20,padding:24}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.05rem",fontWeight:800}}>Recent Activity</div>
                      <span style={{fontSize:"0.72rem",color:"var(--muted)"}}>{(data?.recentActivities??[]).length} trades</span>
                    </div>
                    {!(data?.recentActivities.length) ? (
                      <div style={{textAlign:"center",padding:"24px 20px",color:"var(--muted)"}}>
                        <div style={{fontSize:"2rem",marginBottom:8,opacity:.5}}>🕰️</div>
                        <div style={{fontSize:"0.9rem"}}>No recent activity.</div>
                      </div>
                    ) : (
                      (data.recentActivities as RecentActivity[]).map((act,i) => (
                        <div key={i} style={{padding:"12px 14px",borderRadius:12,background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",marginBottom:9,display:"flex",alignItems:"center",gap:12,transition:"border-color .2s"}}
                          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="rgba(0,245,196,.18)";}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="var(--border)";}}>
                          <div style={{width:32,height:32,borderRadius:8,background:"rgba(0,245,196,.1)",border:"1px solid rgba(0,245,196,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"0.8rem"}}>📥</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:"0.82rem",lineHeight:1.4}}>Bought <strong style={{color:"var(--neon)"}}>{act.stockquantity}</strong> shares of <strong style={{color:"var(--neon)"}}>{act.stockname}</strong></div>
                            <div style={{fontSize:"0.7rem",color:"var(--muted)",marginTop:1}}>@ ${act.stockbuyprice} per share</div>
                          </div>
                          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"0.85rem",fontWeight:700,color:"#00e676",whiteSpace:"nowrap"}}>${(act.stockquantity*act.stockbuyprice).toFixed(2)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* RIGHT */}
                <div style={{display:"flex",flexDirection:"column",gap:20}}>

                  {/* Donut chart */}
                  <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:20,padding:24}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.05rem",fontWeight:800,marginBottom:16}}>Asset Distribution</div>
                    {!dist.length ? (
                      <div style={{textAlign:"center",padding:"24px 20px",color:"var(--muted)"}}>
                        <div style={{fontSize:"2rem",marginBottom:8,opacity:.5}}>🥧</div>
                        <div style={{fontSize:"0.9rem"}}>No assets yet.</div>
                      </div>
                    ) : (
                      <div style={{position:"relative",height:220}}>
                        <Doughnut data={chartData} options={chartOptions}/>
                        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",paddingTop:"30%"}}>
                          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"0.8rem",fontWeight:800}}>${(data?.totalPortfolioValue??0).toFixed(0)}</div>
                          <div style={{fontSize:"0.7rem",color:"var(--muted)",marginTop:2}}>Total Value</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Breakdown */}
                  <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:20,padding:24}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.05rem",fontWeight:800,marginBottom:16}}>Breakdown</div>
                    {!data?.portfolio.length ? (
                      <div style={{textAlign:"center",color:"var(--muted)",fontSize:"0.9rem",padding:"12px 0"}}>No holdings.</div>
                    ) : (
                      data.portfolio.map((item,i) => {
                        const c   = PALETTE[i%PALETTE.length];
                        const val = (livePrices[item.stockname]??item.currentPrice)*item.quantity;
                        const pct = (data.totalPortfolioValue > 0) ? ((val/data.totalPortfolioValue)*100).toFixed(1) : "0";
                        return (
                          <div key={item.stockname} style={{marginBottom:13}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                              <div style={{display:"flex",alignItems:"center",gap:7}}>
                                <div style={{width:9,height:9,borderRadius:"50%",background:c,flexShrink:0}}/>
                                <span style={{fontSize:"0.83rem",fontWeight:600}}>{item.stockname}</span>
                              </div>
                              <span style={{fontSize:"0.78rem",color:"var(--muted)"}}>{pct}%</span>
                            </div>
                            <div style={{height:5,background:"rgba(255,255,255,.06)",borderRadius:3,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${c},${c}88)`,borderRadius:3,transition:"width .6s ease"}}/>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TRADE MODAL ───────────────────────────────────── */}
      {showModal && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowModal(false);}}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:9999,display:"flex",justifyContent:"center",alignItems:"center",backdropFilter:"blur(14px)"}}>
          <div style={{width:460,maxWidth:"96vw",background:"linear-gradient(180deg,#0c1220,#080c18)",border:"1px solid rgba(255,255,255,.1)",borderRadius:28,padding:28,maxHeight:"92vh",overflowY:"auto",position:"relative",animation:"fadeUp .25s ease"}}>
            <button onClick={()=>setShowModal(false)} style={{position:"absolute",top:20,right:20,width:36,height:36,border:"none",borderRadius:10,background:"rgba(255,255,255,.07)",color:"var(--text)",cursor:"pointer",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>

            {/* Header */}
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
              <div style={{width:52,height:52,borderRadius:16,background:tradeMode==="buy"?"linear-gradient(135deg,#00f5c4,#7b61ff)":"linear-gradient(135deg,#ff4d6d,#7b61ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",flexShrink:0}}>
                {tradeMode==="buy"?"🛒":"💸"}
              </div>
              <div>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"1.5rem",fontWeight:800}}>{tradeMode==="buy"?"Buy":"Sell"} <span style={{color:tradeMode==="buy"?"var(--neon)":"var(--neon3)"}}>{selSym||"Asset"}</span></h2>
                <p style={{fontSize:"0.8rem",color:"var(--muted)",marginTop:3}}>Real-time market order</p>
              </div>
            </div>

            {/* Buy/Sell tabs */}
            <div style={{display:"flex",gap:6,padding:5,background:"rgba(255,255,255,.05)",borderRadius:14,marginBottom:18}}>
              {(["buy","sell"] as const).map(m=>(
                <button key={m} onClick={()=>setTradeMode(m)}
                  style={{flex:1,padding:"9px 0",border:"none",borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontSize:"0.82rem",fontWeight:700,cursor:"pointer",transition:"all .22s",
                    background:tradeMode===m?(m==="buy"?"linear-gradient(135deg,var(--neon),var(--neon2))":"linear-gradient(135deg,#ff4d6d,#7b61ff)"):"transparent",
                    color:tradeMode===m?(m==="buy"?"#03040a":"white"):"var(--muted)"}}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Stock/Crypto tabs */}
            <div style={{display:"flex",gap:6,padding:5,background:"rgba(255,255,255,.05)",borderRadius:14,marginBottom:18}}>
              {(["stock","crypto"] as const).map(m=>(
                <button key={m} onClick={()=>{setAssetMode(m);setSelSym("");setSearchQ("");setLivePrice(0);}}
                  style={{flex:1,padding:"9px 0",border:`1px solid ${assetMode===m?(m==="stock"?"rgba(0,245,196,.3)":"rgba(123,97,255,.35)"):"transparent"}`,borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontSize:"0.82rem",fontWeight:700,cursor:"pointer",transition:"all .22s",
                    background:assetMode===m?(m==="stock"?"rgba(0,245,196,.15)":"rgba(123,97,255,.25)"):"transparent",
                    color:assetMode===m?(m==="stock"?"var(--neon)":"var(--neon2)"):"var(--muted)"}}>
                  {m==="stock"?"📈 STOCK":"₿ CRYPTO"}
                </button>
              ))}
            </div>

            {/* Asset search */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:"0.68rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--muted)",marginBottom:7}}>Search {assetMode==="stock"?"Stock":"Crypto"}</div>
              <div style={{position:"relative"}}>
                <input className="input-field" value={searchQ} onChange={e=>{setSearchQ(e.target.value);setShowResults(true);}} onFocus={()=>setShowResults(true)}
                  placeholder={`Search ${assetMode}...`}
                  style={{fontSize:"0.95rem",padding:"13px 16px"}}
                />
                {showResults && filtered.length>0 && (
                  <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#0c1220",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,marginTop:8,maxHeight:240,overflowY:"auto",zIndex:99999}}>
                    {filtered.map(a=>(
                      <div key={a.sym} onClick={()=>selectAsset(a.sym)}
                        style={{padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,.05)",cursor:"pointer",transition:".2s"}}
                        onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,.04)";}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="transparent";}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontWeight:700}}>{a.sym}</div>
                            <div style={{fontSize:"0.75rem",color:"var(--muted)",marginTop:2}}>{a.name}</div>
                          </div>
                          <span style={{fontSize:"0.75rem",fontWeight:700,color:a.type==="crypto"?"var(--neon2)":"var(--neon)",textTransform:"uppercase"}}>{a.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live price */}
            <div style={{padding:"16px 18px",background:"rgba(255,255,255,.04)",borderRadius:14,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--muted)"}}>Current Price</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.5rem",fontWeight:800,color:"var(--neon)"}}>
                  {priceFetching ? "..." : livePrice>0 ? `$${livePrice.toFixed(2)}` : "—"}
                </div>
              </div>
              <div style={{fontSize:"0.75rem",color:"var(--muted)"}}>
                {priceFetching ? "Fetching..." : livePrice>0 ? "Yahoo Finance Live" : "Select an asset"}
              </div>
            </div>

            {/* Quantity */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:"0.68rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--muted)",marginBottom:7}}>Quantity</div>
              <input type="number" min={1} value={qty} onChange={e=>setQty(Math.max(1,parseInt(e.target.value)||1))}
                className="input-field" style={{fontSize:"0.95rem",padding:"13px 16px"}}/>
            </div>

            {/* Total */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderRadius:14,background:`linear-gradient(135deg,rgba(0,245,196,.06),rgba(123,97,255,.06))`,border:"1px solid rgba(0,245,196,.15)",marginBottom:18}}>
              <span style={{fontSize:"0.82rem",color:"var(--muted)"}}>Total Amount</span>
              <span style={{fontFamily:"'Syne',sans-serif",fontSize:"1.5rem",fontWeight:800,color:tradeMode==="buy"?"var(--neon)":"var(--neon3)"}}>
                {total>0 ? `$${total.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}` : "$0.00"}
              </span>
            </div>

            {/* Confirm */}
            <button onClick={tradeMode==="buy"?confirmBuy:confirmSell}
              disabled={!selSym||!livePrice}
              style={{width:"100%",padding:15,border:"none",borderRadius:14,fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:"0.95rem",cursor:!selSym||!livePrice?"not-allowed":"pointer",transition:"all .25s",letterSpacing:"0.5px",textTransform:"uppercase",opacity:!selSym||!livePrice?.4:1,
                background:tradeMode==="buy"?"linear-gradient(135deg,#00f5c4,#7b61ff)":"linear-gradient(135deg,#ff4d6d,#7b61ff)",
                color:tradeMode==="buy"?"#03040a":"white"}}>
              CONFIRM {tradeMode.toUpperCase()}
            </button>
          </div>
        </div>
      )}

      {/* ── SELL FROM TABLE MODAL ─────────────────────────── */}
      {sellModal && (
        <div onClick={e=>{if(e.target===e.currentTarget)setSellModal(null);}}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:9999,display:"flex",justifyContent:"center",alignItems:"center",backdropFilter:"blur(12px)"}}>
          <div style={{width:440,maxWidth:"96vw",background:"#0a0e1a",border:"1px solid rgba(255,255,255,.1)",borderRadius:24,padding:30,color:"var(--text)",animation:"fadeUp .25s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.5rem",fontWeight:800}}>Sell <span style={{color:"var(--neon3)"}}>{sellModal.stockname}</span></div>
              <button onClick={()=>setSellModal(null)} style={{width:36,height:36,border:"none",borderRadius:10,background:"rgba(255,255,255,.06)",color:"var(--text)",cursor:"pointer",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div style={{background:"rgba(255,255,255,.04)",borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--muted)",marginBottom:8}}>Current Price</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.4rem",fontWeight:800,color:"var(--neon)"}}>${(livePrices[sellModal.stockname]??sellModal.currentPrice).toFixed(2)}</div>
            </div>
            <div style={{background:"rgba(255,255,255,.04)",borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--muted)",marginBottom:8}}>You hold</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.4rem",fontWeight:800,color:"var(--text)"}}>{sellModal.quantity} shares</div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--muted)",marginBottom:7}}>Quantity to sell</div>
              <input type="number" min={1} max={sellModal.quantity} value={sellQty} onChange={e=>setSellQty(Math.min(sellModal.quantity,Math.max(1,parseInt(e.target.value)||1)))}
                className="input-field" style={{fontSize:"1rem",padding:14}}/>
              <div style={{fontSize:"0.72rem",color:"var(--muted)",marginTop:8}}>Max: {sellModal.quantity} shares</div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:16,borderRadius:14,background:"linear-gradient(135deg,rgba(255,77,109,.06),rgba(123,97,255,.06))",border:"1px solid rgba(255,255,255,.06)",marginBottom:20}}>
              <span style={{fontSize:"0.85rem",color:"var(--muted)"}}>Proceeds</span>
              <span style={{fontFamily:"'Syne',sans-serif",fontSize:"1.5rem",fontWeight:800,color:"var(--neon3)"}}>
                ${(sellQty*(livePrices[sellModal.stockname]??sellModal.currentPrice)).toFixed(2)}
              </span>
            </div>
            <button onClick={confirmTableSell}
              style={{width:"100%",padding:15,border:"none",borderRadius:14,background:"linear-gradient(135deg,#ff4d6d,#7b61ff)",color:"white",fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:"1rem",cursor:"pointer",transition:"all .25s",letterSpacing:"0.5px"}}>
              CONFIRM SELL
            </button>
          </div>
        </div>
      )}
    </>
  );
}
