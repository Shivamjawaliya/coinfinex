import { useEffect, useRef, useState, useCallback } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { getPortfolio, buyStock, sellStock, getStockPrice } from "../services/api";
import Sidebar from "../components/Sidebar";
import type { PortfolioData, PortfolioItem, AssetDistribution } from "../types";

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = ["#00f5c4","#7b61ff","#ff6b6b","#ffb800","#00e676","#38bdf8"];

const QUICK_STOCKS = [
  { sym:"AAPL",  price:"$212", chg:"+1.2%", up:true  },
  { sym:"TSLA",  price:"$248", chg:"+3.4%", up:true  },
  { sym:"NVDA",  price:"$875", chg:"+2.1%", up:true  },
  { sym:"MSFT",  price:"$415", chg:"-0.3%", up:false },
  { sym:"AMZN",  price:"$191", chg:"+0.8%", up:true  },
  { sym:"GOOGL", price:"$175", chg:"-0.5%", up:false },
  { sym:"META",  price:"$512", chg:"+1.6%", up:true  },
  { sym:"JPM",   price:"$201", chg:"+0.4%", up:true  },
];

interface RecentActivity { stockname:string; stockquantity:number; stockbuyprice:number; }

/* ── Toast ──────────────────────────────────────────────── */
function Toast({ msg, type }: { msg:string; type:"success"|"error" }) {
  return (
    <div style={{ position:"fixed",bottom:30,left:"50%",transform:"translateX(-50%)",padding:"14px 24px",borderRadius:14,fontWeight:700,zIndex:99999,pointerEvents:"none",whiteSpace:"nowrap",fontSize:"0.9rem",
      background:type==="success"?"linear-gradient(135deg,rgba(0,245,196,.9),rgba(0,200,150,.9))":"linear-gradient(135deg,rgba(255,77,109,.9),rgba(123,97,255,.9))",
      color:type==="success"?"#03040a":"white",boxShadow:"0 8px 24px rgba(0,0,0,.4)",
    }}>{msg}</div>
  );
}

export default function Portfolio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData]         = useState<PortfolioData|null>(null);
  const [loading, setLoading]   = useState(true);
  const [livePrices, setLivePrices] = useState<Record<string,number>>({});
  const [toast, setToast]       = useState<{msg:string;type:"success"|"error"}|null>(null);

  /* buy modal */
  const [buyModal, setBuyModal]     = useState<string|null>(null); // symbol
  const [buyPrice, setBuyPrice]     = useState(0);
  const [buyFetching, setBuyFetching] = useState(false);
  const [buyQty, setBuyQty]         = useState(1);

  /* sell modal */
  const [sellModal, setSellModal]   = useState<PortfolioItem|null>(null);
  const [sellQty, setSellQty]       = useState(1);

  /* ── load ────────────────────────────────────────────── */
  const load = useCallback(() => {
    setLoading(true);
    getPortfolio()
      .then(r => setData(r.data))
      .catch(err => {
        if (err?.response?.status === 401) window.location.href = "/login";
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  /* ── poll live prices for holdings ──────────────────── */
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

  /* ── toast ───────────────────────────────────────────── */
  const showToast = (msg: string, type: "success"|"error") => {
    setToast({msg,type});
    setTimeout(() => setToast(null), 2600);
  };

  /* ── particle canvas ─────────────────────────────────── */
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;
    let W=0,H=0,raf=0,mx=-9999,my=-9999;
    const resize=()=>{W=cv.width=window.innerWidth;H=cv.height=window.innerHeight;};
    resize(); window.addEventListener("resize",resize);
    const PAL=["#00f5c4","#7b61ff","#ff6b6b"];
    const pts=Array.from({length:80},()=>({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,r:Math.random()*1.3+.3,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,a:Math.random()*.28+.06,col:PAL[Math.floor(Math.random()*PAL.length)]}));
    const onM=(e:MouseEvent)=>{mx=e.clientX;my=e.clientY;};
    window.addEventListener("mousemove",onM);
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){const d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y);if(d<100){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle="#00f5c4";ctx.globalAlpha=(1-d/100)*.045;ctx.lineWidth=.5;ctx.stroke();}}
      pts.forEach(p=>{const dx=p.x-mx,dy=p.y-my,d=Math.hypot(dx,dy);if(d<110){const f=((110-d)/110)*.4;p.vx+=(dx/d)*f;p.vy+=(dy/d)*f;}p.vx*=.983;p.vy*=.983;p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.globalAlpha=p.a;ctx.fillStyle=p.col;ctx.fill();});
      ctx.globalAlpha=1; raf=requestAnimationFrame(draw);
    };
    draw();
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);window.removeEventListener("mousemove",onM);};
  },[]);

  /* ── open buy modal ──────────────────────────────────── */
  const openBuy = async (sym: string) => {
    setBuyModal(sym); setBuyQty(1); setBuyPrice(0); setBuyFetching(true);
    try {
      const r = await getStockPrice(sym);
      if (r.data.success) setBuyPrice(r.data.price);
    } catch {}
    setBuyFetching(false);
  };

  /* ── confirm buy ─────────────────────────────────────── */
  const confirmBuy = async () => {
    if (!buyModal || !buyPrice) return;
    try {
      await buyStock(buyModal, buyQty, buyPrice);
      setBuyModal(null);
      showToast(`✓ Bought ${buyQty} × ${buyModal}`, "success");
      load();
    } catch { showToast("Buy failed","error"); }
  };

  /* ── confirm sell ────────────────────────────────────── */
  const confirmSell = async () => {
    if (!sellModal) return;
    try {
      await sellStock(sellModal.stockname, sellQty);
      setSellModal(null);
      showToast(`✓ Sold ${sellQty} × ${sellModal.stockname}`, "success");
      load();
    } catch { showToast("Sell failed","error"); }
  };

  /* ── chart ───────────────────────────────────────────── */
  const dist: AssetDistribution[] = data?.assetDistribution ?? [];
  const chartData = {
    labels: dist.map(d => d.name),
    datasets:[{ data:dist.map(d=>d.value), backgroundColor:PALETTE, borderColor:"rgba(0,0,0,0)", hoverOffset:8, borderRadius:4 }],
  };
  const chartOptions = {
    responsive:true, maintainAspectRatio:false, cutout:"65%",
    plugins:{
      legend:{ labels:{ color:"rgba(240,240,240,.7)", font:{family:"DM Sans",size:12}, padding:16 }},
      tooltip:{ backgroundColor:"#0a0e1a", borderColor:"rgba(255,255,255,.1)", borderWidth:1, titleColor:"#00f5c4", bodyColor:"#f0f0f0", padding:12 },
    },
  };

  const isProfit = (data?.totalProfit ?? 0) >= 0;

  /* ── card hover handlers ─────────────────────────────── */
  const hoverIn  = (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.borderColor="rgba(0,245,196,.22)"; e.currentTarget.style.boxShadow="0 20px 50px rgba(0,0,0,.4)"; };
  const hoverOut = (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform=""; e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.boxShadow=""; };

  return (
    <>
      <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>
      <div className="aurora"><div className="ab"/><div className="ab"/><div className="ab"/></div>
      <div className="grid-lines"/>
      <Sidebar active="portfolio"/>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}

      <div className="page-wrap">
        <div className="live-bar">
          <div className="live-dot"/><span className="live-text">Live</span>
          <span>Real-time portfolio snapshot</span>
        </div>
        <div className="topbar">
          <div><h1>Portfolio</h1><p>Your holdings &amp; performance overview</p></div>
        </div>

        <div className="page-content" style={{paddingTop:24}}>

          {/* Banner */}
          <div style={{background:"linear-gradient(135deg,rgba(0,245,196,.06),rgba(123,97,255,.06))",border:"1px solid rgba(0,245,196,.18)",borderRadius:20,padding:"28px 32px",marginBottom:28,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 10% 50%,rgba(0,245,196,.04),transparent 60%)",pointerEvents:"none"}}/>
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.5rem",fontWeight:800,background:"linear-gradient(135deg,var(--text),var(--neon))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Portfolio</div>
              <div style={{fontSize:"0.88rem",color:"var(--muted)",marginTop:4}}>Trade with simulated balance using real-time market data. Zero risk, real experience.</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:10,background:"rgba(0,245,196,.08)",border:"1px solid rgba(0,245,196,.25)",fontSize:"0.82rem",color:"var(--neon)",fontWeight:600}}>
              <div className="live-dot"/> Live Market Data
            </div>
          </div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner"/></div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid-4" style={{marginBottom:24}}>
                {[
                  {icon:"💼", label:"Portfolio Value", val:`$${(data?.totalPortfolioValue??0).toFixed(2)}`,  sub:"Total market value",  color:"var(--neon)",   glow:"rgba(0,245,196,.14)"},
                  {icon:isProfit?"📈":"📉", label:"Total P&L",       val:`${isProfit?"+":""}$${(data?.totalProfit??0).toFixed(2)}`, sub:"Unrealised P/L",   color:isProfit?"#00e676":"var(--neon3)", glow:isProfit?"rgba(0,230,118,.14)":"rgba(255,107,107,.14)"},
                  {icon:"🎯", label:"Return %",       val:`${isProfit?"+":""}${data?.totalProfitPercent??0}%`, sub:"Overall return",     color:isProfit?"#00e676":"var(--neon3)", glow:"rgba(255,184,0,.14)"},
                  {icon:"🏦", label:"Holdings",       val:String(data?.portfolio.length??0),                  sub:"Unique positions",   color:"var(--neon2)", glow:"rgba(123,97,255,.14)"},
                ].map((s,i) => (
                  <div key={i} onMouseEnter={hoverIn} onMouseLeave={hoverOut}
                    style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:20,padding:24,position:"relative",overflow:"hidden",transition:"transform .3s,border-color .3s,box-shadow .3s"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,var(--neon),var(--neon2))"}}/>
                    <div style={{position:"absolute",top:-60,right:-60,width:150,height:150,borderRadius:"50%",background:`radial-gradient(circle,${s.glow},transparent 70%)`,filter:"blur(20px)"}}/>
                    <div style={{width:40,height:40,borderRadius:10,background:"rgba(0,245,196,.1)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,fontSize:"1.1rem"}}>{s.icon}</div>
                    <div style={{fontSize:"0.7rem",letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)",marginBottom:8}}>{s.label}</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:"2rem",fontWeight:800,lineHeight:1,color:s.color}}>{s.val}</div>
                    <div style={{fontSize:"0.78rem",color:"var(--muted)",marginTop:6}}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Quick Buy */}
              <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:20,padding:24,marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.1rem",fontWeight:800}}>Quick Buy</div>
                  <span style={{fontSize:"0.78rem",color:"var(--muted)"}}>Click any stock to trade instantly</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10}}>
                  {QUICK_STOCKS.map(s => (
                    <div key={s.sym} onClick={() => openBuy(s.sym)}
                      style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:14,padding:14,cursor:"pointer",transition:"all .25s",textAlign:"center"}}
                      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="rgba(0,245,196,.3)";(e.currentTarget as HTMLDivElement).style.background="rgba(0,245,196,.04)";(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)";}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="var(--border)";(e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,.03)";(e.currentTarget as HTMLDivElement).style.transform="";}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:"0.95rem",fontWeight:800,color:"var(--neon)",marginBottom:4}}>{s.sym}</div>
                      <div style={{fontSize:"0.8rem",color:"var(--muted)"}}>{s.price}</div>
                      <div style={{fontSize:"0.75rem",fontWeight:600,color:s.up?"#00e676":"var(--neon3)"}}>{s.chg}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2-column layout */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20,alignItems:"start"}}>

                {/* LEFT */}
                <div style={{display:"flex",flexDirection:"column",gap:20}}>

                  {/* Holdings table */}
                  <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:20,padding:24}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.1rem",fontWeight:800}}>Your Holdings</div>
                      {(data?.portfolio.length??0)>0 && <span style={{fontSize:"0.78rem",color:"var(--muted)",background:"rgba(255,255,255,.05)",border:"1px solid var(--border)",padding:"4px 12px",borderRadius:999}}>{data?.portfolio.length} positions</span>}
                    </div>

                    {!data?.portfolio.length ? (
                      <div style={{textAlign:"center",padding:"60px 20px",color:"var(--muted)"}}>
                        <div style={{fontSize:"3rem",marginBottom:12,opacity:.5}}>📂</div>
                        <div style={{fontSize:"0.95rem"}}>No holdings yet. Use Quick Buy above to start trading.</div>
                      </div>
                    ) : (
                      <div style={{overflowX:"auto"}}>
                        <table className="data-table">
                          <thead><tr><th>Asset</th><th>Qty</th><th>Buy Price</th><th>Current</th><th>Total Value</th><th>P&amp;L</th><th>Return</th><th>Action</th></tr></thead>
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
                                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                                      <a href={`/stock/${item.stockname}`} rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:10}}>
                                        <div style={{width:36,height:36,borderRadius:9,background:`linear-gradient(135deg,${c},${c}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontSize:"0.72rem",fontWeight:800,color:"#03040a",flexShrink:0}}>
                                          {item.stockname.slice(0,2).toUpperCase()}
                                        </div>
                                      </a>
                                      <div>
                                        <div style={{fontFamily:"'Syne',sans-serif",fontSize:"0.9rem",fontWeight:800}}>{item.stockname}</div>
                                        <div style={{fontSize:"0.72rem",color:"var(--muted)",marginTop:2}}>Virtual Position</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{fontWeight:600}}>{item.quantity}</td>
                                  <td>${item.buyPrice.toFixed(2)}</td>
                                  <td style={{color:"var(--neon)",fontWeight:600}}>${cur.toFixed(2)}</td>
                                  <td style={{fontWeight:600}}>${val.toFixed(2)}</td>
                                  <td style={{color:up?"#00e676":"var(--neon3)",fontWeight:700}}>{up?"+":""}${pnl.toFixed(2)}</td>
                                  <td>
                                    <span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:999,fontSize:"0.75rem",fontWeight:700,background:up?"rgba(0,230,118,.12)":"rgba(255,107,107,.12)",color:up?"#00e676":"var(--neon3)"}}>
                                      {up?"▲":"▼"} {item.profitPercent}%
                                    </span>
                                  </td>
                                  <td>
                                    <button onClick={() => { setSellModal(item); setSellQty(1); }}
                                      style={{padding:"8px 16px",border:"1px solid rgba(255,77,109,.35)",borderRadius:10,background:"linear-gradient(135deg,rgba(255,77,109,.15),rgba(123,97,255,.15))",color:"var(--neon3)",fontFamily:"'DM Sans',sans-serif",fontSize:"0.78rem",fontWeight:700,cursor:"pointer",transition:"all .25s",letterSpacing:"0.5px",whiteSpace:"nowrap"}}
                                      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="linear-gradient(135deg,rgba(255,77,109,.28),rgba(123,97,255,.28))";(e.currentTarget as HTMLButtonElement).style.transform="translateY(-1px)";}}
                                      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="linear-gradient(135deg,rgba(255,77,109,.15),rgba(123,97,255,.15))";(e.currentTarget as HTMLButtonElement).style.transform="";}}>
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
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.1rem",fontWeight:800}}>Recent Activity</div>
                      <span style={{fontSize:"0.72rem",color:"var(--muted)"}}>{(data?.recentActivities??[]).length} trades</span>
                    </div>
                    {!(data?.recentActivities?.length) ? (
                      <div style={{textAlign:"center",padding:"30px 20px",color:"var(--muted)"}}>
                        <div style={{fontSize:"2.5rem",marginBottom:10,opacity:.5}}>🕰️</div>
                        <div style={{fontSize:"0.95rem"}}>No recent activity.</div>
                      </div>
                    ) : (
                      (data.recentActivities as RecentActivity[]).map((act,i) => (
                        <div key={i} style={{padding:"14px 16px",borderRadius:14,background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",marginBottom:10,display:"flex",alignItems:"center",gap:14,transition:"border-color .25s,background .25s"}}
                          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="rgba(0,245,196,.2)";(e.currentTarget as HTMLDivElement).style.background="rgba(0,245,196,.03)";}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="var(--border)";(e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,.03)";}}>
                          <div style={{width:34,height:34,borderRadius:9,background:"rgba(0,245,196,.1)",border:"1px solid rgba(0,245,196,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"0.85rem"}}>📥</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:"0.85rem",lineHeight:1.4}}>Bought <strong style={{color:"var(--neon)"}}>{act.stockquantity} shares</strong> of <strong style={{color:"var(--neon)"}}>{act.stockname}</strong></div>
                            <div style={{fontSize:"0.72rem",color:"var(--muted)",marginTop:2}}>@ ${act.stockbuyprice} per share</div>
                          </div>
                          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"0.88rem",fontWeight:700,color:"#00e676",whiteSpace:"nowrap"}}>${(act.stockquantity*act.stockbuyprice).toFixed(2)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* RIGHT */}
                <div style={{display:"flex",flexDirection:"column",gap:20}}>

                  {/* Donut chart */}
                  <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:20,padding:24}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.1rem",fontWeight:800,marginBottom:16}}>Asset Distribution</div>
                    {!dist.length ? (
                      <div style={{textAlign:"center",padding:"30px 20px",color:"var(--muted)"}}>
                        <div style={{fontSize:"2.5rem",marginBottom:10,opacity:.5}}>🥧</div>
                        <div style={{fontSize:"0.95rem"}}>No assets yet.</div>
                      </div>
                    ) : (
                      <div style={{position:"relative",height:220}}>
                        <Doughnut data={chartData} options={chartOptions}/>
                      </div>
                    )}
                  </div>

                  {/* Breakdown */}
                  <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:20,padding:24}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.1rem",fontWeight:800,marginBottom:16}}>Breakdown</div>
                    {!data?.portfolio.length ? (
                      <div style={{textAlign:"center",color:"var(--muted)",fontSize:"0.9rem",padding:"12px 0"}}>No holdings to show.</div>
                    ) : (
                      data.portfolio.map((item,i) => {
                        const c   = PALETTE[i%PALETTE.length];
                        const val = (livePrices[item.stockname]??item.currentPrice)*item.quantity;
                        const pct = (data.totalPortfolioValue>0)?((val/data.totalPortfolioValue)*100).toFixed(1):"0";
                        const up  = item.profit >= 0;
                        return (
                          <div key={item.stockname} style={{marginBottom:14}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:10,height:10,borderRadius:"50%",background:c,flexShrink:0}}/>
                                <span style={{fontSize:"0.85rem",fontWeight:600}}>{item.stockname}</span>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <span style={{fontSize:"0.75rem",fontWeight:600,color:up?"#00e676":"var(--neon3)"}}>{up?"+":""}${item.profit.toFixed(2)}</span>
                                <span style={{fontSize:"0.82rem",color:"var(--muted)"}}>{pct}%</span>
                              </div>
                            </div>
                            <div style={{height:6,background:"rgba(255,255,255,.06)",borderRadius:3,overflow:"hidden"}}>
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

      {/* ── BUY MODAL ──────────────────────────────────────── */}
      {buyModal && (
        <div onClick={e=>{if(e.target===e.currentTarget)setBuyModal(null);}}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:9999,display:"flex",justifyContent:"center",alignItems:"center",backdropFilter:"blur(12px)"}}>
          <div style={{width:440,maxWidth:"96vw",background:"#0a0e1a",border:"1px solid rgba(255,255,255,.1)",borderRadius:24,padding:30,color:"var(--text)",animation:"fadeUp .25s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.5rem",fontWeight:800}}>Buy <span style={{color:"var(--neon)"}}>{buyModal}</span></div>
              <button onClick={()=>setBuyModal(null)} style={{width:36,height:36,border:"none",borderRadius:10,background:"rgba(255,255,255,.06)",color:"var(--text)",cursor:"pointer",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s"}}>✕</button>
            </div>

            <div style={{background:"rgba(255,255,255,.04)",borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--muted)",marginBottom:8}}>Symbol</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.4rem",fontWeight:800,color:"var(--neon)"}}>{buyModal}</div>
            </div>

            <div style={{background:"rgba(255,255,255,.04)",borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--muted)",marginBottom:8}}>Live Price</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.4rem",fontWeight:800,color:"var(--neon)"}}>
                {buyFetching ? "Fetching..." : buyPrice>0 ? `$${buyPrice.toFixed(2)}` : "Unavailable"}
              </div>
            </div>

            <div style={{marginBottom:14}}>
              <div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--muted)",marginBottom:7}}>Quantity</div>
              <input type="number" min={1} value={buyQty} onChange={e=>setBuyQty(Math.max(1,parseInt(e.target.value)||1))}
                className="input-field" style={{fontSize:"1rem",padding:14}}/>
              <div style={{fontSize:"0.72rem",color:"var(--muted)",marginTop:8}}>Enter how many shares you want to buy</div>
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:16,borderRadius:14,background:"linear-gradient(135deg,rgba(0,245,196,.06),rgba(123,97,255,.06))",border:"1px solid rgba(255,255,255,.06)",marginBottom:20}}>
              <span style={{fontSize:"0.85rem",color:"var(--muted)"}}>Estimated cost</span>
              <span style={{fontFamily:"'Syne',sans-serif",fontSize:"1.6rem",fontWeight:800,color:"var(--neon)"}}>
                {buyPrice>0 ? `$${(buyQty*buyPrice).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}` : "$0.00"}
              </span>
            </div>

            <button onClick={confirmBuy} disabled={!buyPrice}
              style={{width:"100%",padding:15,border:"none",borderRadius:14,background:"linear-gradient(135deg,#00f5c4,#7b61ff)",color:"#03040a",fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:"1rem",cursor:!buyPrice?"not-allowed":"pointer",opacity:!buyPrice?.5:1,transition:"all .25s",letterSpacing:"0.5px"}}>
              CONFIRM BUY
            </button>
          </div>
        </div>
      )}

      {/* ── SELL MODAL ─────────────────────────────────────── */}
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
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.4rem",fontWeight:800,color:"var(--neon)"}}>
                ${(livePrices[sellModal.stockname]??sellModal.currentPrice).toFixed(2)}
              </div>
            </div>

            <div style={{marginBottom:14}}>
              <div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--muted)",marginBottom:7}}>Quantity to sell</div>
              <input type="number" min={1} max={sellModal.quantity} value={sellQty}
                onChange={e=>setSellQty(Math.min(sellModal.quantity,Math.max(1,parseInt(e.target.value)||1)))}
                className="input-field" style={{fontSize:"1rem",padding:14}}/>
              <div style={{fontSize:"0.72rem",color:"var(--muted)",marginTop:8}}>Available: {sellModal.quantity} shares</div>
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:16,borderRadius:14,background:"linear-gradient(135deg,rgba(255,77,109,.06),rgba(123,97,255,.06))",border:"1px solid rgba(255,255,255,.06)",marginBottom:20}}>
              <span style={{fontSize:"0.85rem",color:"var(--muted)"}}>You will receive</span>
              <span style={{fontFamily:"'Syne',sans-serif",fontSize:"1.6rem",fontWeight:800,color:"var(--neon3)"}}>
                ${(sellQty*(livePrices[sellModal.stockname]??sellModal.currentPrice)).toFixed(2)}
              </span>
            </div>

            <button onClick={confirmSell}
              style={{width:"100%",padding:15,border:"none",borderRadius:14,background:"linear-gradient(135deg,#ff4d6d,#7b61ff)",color:"white",fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:"1rem",cursor:"pointer",transition:"all .25s",letterSpacing:"0.5px"}}>
              CONFIRM SELL
            </button>
          </div>
        </div>
      )}
    </>
  );
}
