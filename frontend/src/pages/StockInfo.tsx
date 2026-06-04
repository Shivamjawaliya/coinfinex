import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getStock, buyStock, getStockPrice } from "../services/api";
import Sidebar from "../components/Sidebar";
import type { StockQuote, StockOverview, HistoryPoint, NewsItem } from "../types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface StockData {
  symbol: string;
  quote: StockQuote;
  overview: StockOverview;
  history: HistoryPoint[];
  news: NewsItem[];
}

/* ── helpers ────────────────────────────────────────────── */
const fmtB = (v: number | string) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n) || n === 0) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
};
const fmtDollar = (v: number | string) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) || n === 0 ? "—" : `$${n.toFixed(2)}`;
};
const fmtPlain  = (v: number | string) => (v === "—" || v === 0 ? "—" : String(v));

const RANGES = [
  { label:"1D", days:1 }, { label:"1M", days:30 }, { label:"3M", days:90 },
  { label:"6M", days:180 }, { label:"1Y", days:365 }, { label:"All", days:9999 },
];

/* ── toast ──────────────────────────────────────────────── */
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{ position:"fixed",bottom:30,left:"50%",transform:"translateX(-50%)",padding:"13px 24px",borderRadius:14,fontWeight:700,zIndex:99999,pointerEvents:"none",whiteSpace:"nowrap",fontSize:"0.9rem",
      background:ok?"#10b981":"linear-gradient(135deg,rgba(255,77,109,.9),rgba(123,97,255,.9))",
      color:"white",boxShadow:"0 8px 24px rgba(0,0,0,.4)",
    }}>{msg}</div>
  );
}

export default function StockInfo() {
  const { symbol }  = useParams<{ symbol: string }>();
  const navigate    = useNavigate();
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const chartRef    = useRef<ChartJS<"line">>(null);

  const [data, setData]         = useState<StockData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [range, setRange]       = useState(30);
  const [qty, setQty]           = useState(1);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buying, setBuying]     = useState(false);
  const [toast, setToast]       = useState<{ msg:string; ok:boolean } | null>(null);
  const [watchlisted, setWatchlisted] = useState(false);

  /* ── load stock data ────────────────────────────────── */
  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    getStock(symbol)
      .then(r => setData(r.data))
      .catch(() => navigate("/explore"))
      .finally(() => setLoading(false));
  }, [symbol, navigate]);

  /* ── live price poll ────────────────────────────────── */
  useEffect(() => {
    if (!symbol) return;
    getStockPrice(symbol).then(r => { if (r.data.success) setLivePrice(r.data.price); });
    const poll = setInterval(() => {
      getStockPrice(symbol).then(r => { if (r.data.success) setLivePrice(r.data.price); });
    }, 15000);
    return () => clearInterval(poll);
  }, [symbol]);

  /* ── particle canvas ────────────────────────────────── */
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;
    let W=0,H=0,raf=0,mx=-9999,my=-9999;
    const resize=()=>{W=cv.width=window.innerWidth;H=cv.height=window.innerHeight;};
    resize(); window.addEventListener("resize",resize);
    const PAL=["#00f5c4","#7b61ff","#ff6b6b"];
    const pts=Array.from({length:70},()=>({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,r:Math.random()*1.2+.3,vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28,a:Math.random()*.25+.06,col:PAL[Math.floor(Math.random()*3)]}));
    const onM=(e:MouseEvent)=>{mx=e.clientX;my=e.clientY;};
    window.addEventListener("mousemove",onM);
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){const d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y);if(d<90){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle="#00f5c4";ctx.globalAlpha=(1-d/90)*.04;ctx.lineWidth=.5;ctx.stroke();}}
      pts.forEach(p=>{const dx=p.x-mx,dy=p.y-my,d=Math.hypot(dx,dy);if(d<100){const f=((100-d)/100)*.42;p.vx+=(dx/d)*f;p.vy+=(dy/d)*f;}p.vx*=.982;p.vy*=.982;p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.globalAlpha=p.a;ctx.fillStyle=p.col;ctx.fill();});
      ctx.globalAlpha=1; raf=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);window.removeEventListener("mousemove",onM);};
  },[]);

  /* ── chart data ─────────────────────────────────────── */
  const chartDataset = useMemo(() => {
    if (!data?.history.length) return null;
    const slice = range >= 9999
      ? [...data.history].reverse()
      : [...data.history].slice(0, range).reverse();
    const prices = slice.map(h => h.close);
    const labels = slice.map(h => {
      const d = new Date(h.date);
      return d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
    });
    const up = prices.length < 2 || prices[prices.length-1] >= prices[0];
    const color = up ? "#00f5c4" : "#ff4d6d";
    return { prices, labels, color };
  }, [data, range]);

  const buildChartData = useCallback(() => {
    if (!chartDataset) return { labels:[], datasets:[] };
    const { labels, prices, color } = chartDataset;
    return {
      labels,
      datasets:[{
        label: `${symbol} Close`,
        data: prices,
        borderColor: color,
        backgroundColor: (ctx: { chart: ChartJS }) => {
          const g = ctx.chart.ctx.createLinearGradient(0,0,0,320);
          g.addColorStop(0, color==="	#00f5c4" ? "rgba(0,245,196,0.18)" : "rgba(255,77,109,0.18)");
          g.addColorStop(1, "rgba(0,0,0,0)");
          return g;
        },
        borderWidth: 2, pointRadius: 0, pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        tension: 0.35, fill: true,
      }],
    };
  }, [chartDataset, symbol]);

  const chartOptions = useMemo(() => ({
    responsive:true, maintainAspectRatio:false,
    interaction:{ intersect:false, mode:"index" as const },
    plugins:{
      legend:{ display:false },
      tooltip:{ backgroundColor:"#0d0f1a", borderColor:"rgba(255,255,255,.08)", borderWidth:1,
        titleColor: chartDataset?.color ?? "#00f5c4", bodyColor:"#f0f0f0",
        padding:12, callbacks:{ label:(c: { parsed: { y: number } }) => ` $${c.parsed.y.toFixed(2)}` },
      },
    },
    scales:{
      x:{ grid:{ color:"rgba(255,255,255,.04)" }, ticks:{ color:"rgba(240,240,240,.35)", font:{ family:"DM Sans", size:10 }, maxTicksLimit:8, maxRotation:0 }},
      y:{ position:"right" as const, grid:{ color:"rgba(255,255,255,.04)" }, ticks:{ color:"rgba(240,240,240,.35)", font:{ family:"DM Sans", size:10 }, callback:(v:number|string) => `$${Number(v).toLocaleString("en-US",{maximumFractionDigits:2})}` }},
    },
  }), [chartDataset]);

  /* ── buy ─────────────────────────────────────────────── */
  const showToast = (msg: string, ok: boolean) => {
    setToast({msg,ok}); setTimeout(()=>setToast(null),2800);
  };

  const confirmBuy = async () => {
    if (!symbol || !price) return;
    setBuying(true);
    try {
      await buyStock(symbol, qty, price);
      setShowBuyModal(false);
      showToast(`✓ Bought ${qty} × ${symbol}`, true);
    } catch { showToast("Purchase failed", false); }
    setBuying(false);
  };

  /* ── derived values ─────────────────────────────────── */
  const price  = livePrice ?? data?.quote.price ?? 0;
  const change = data?.quote.change ?? 0;
  const isUp   = change >= 0;

  const hi52 = parseFloat(String(data?.overview.week52High ?? ""));
  const lo52 = parseFloat(String(data?.overview.week52Low  ?? ""));
  const show52 = !isNaN(hi52) && !isNaN(lo52) && hi52>0 && lo52>0 && price>0;
  const pct52  = show52 ? Math.min(100, Math.max(0, ((price-lo52)/(hi52-lo52))*100)) : 50;

  /* ── stat row ───────────────────────────────────────── */
  const StatRow = ({ label, value, accent }: { label:string; value:string; accent?:"up"|"dn"|"neon" }) => (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:"1px solid var(--border)"}}>
      <span style={{fontSize:"0.75rem",color:"var(--muted)",letterSpacing:"0.5px"}}>{label}</span>
      <span style={{fontSize:"0.9rem",fontWeight:600,color:accent==="up"?"#00e676":accent==="dn"?"#ff4d6d":accent==="neon"?"var(--neon)":"var(--text)"}}>{value}</span>
    </div>
  );

  return (
    <>
      <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>
      <div className="aurora"><div className="ab"/><div className="ab"/><div className="ab"/></div>
      <div className="grid-lines"/>
      <Sidebar active="categories"/>
      {toast && <Toast msg={toast.msg} ok={toast.ok}/>}

      <div className="page-wrap">
        <div className="live-bar">
          <div className="live-dot"/><span className="live-text">Live</span>
          <span>{symbol} · price auto-refreshes every 15s</span>
        </div>

        {/* back bar */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 36px",borderBottom:"1px solid var(--border)",background:"rgba(3,4,10,.85)",backdropFilter:"blur(20px)"}}>
          <button onClick={()=>navigate(-1)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",fontSize:"0.82rem",cursor:"pointer",transition:"all .2s"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="var(--neon)";(e.currentTarget as HTMLButtonElement).style.color="var(--neon)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="var(--border)";(e.currentTarget as HTMLButtonElement).style.color="var(--muted)";}}>
            ← Back
          </button>
          <span style={{fontSize:"0.85rem",color:"var(--muted)"}}>Explore</span>
          <span style={{color:"var(--border)"}}>/</span>
          <strong style={{fontSize:"0.85rem"}}>{symbol}</strong>
        </div>

        <div style={{padding:"0 36px 60px",position:"relative",zIndex:1}}>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner"/></div>
          ) : !data ? null : (
            <>
              {/* ── HERO ──────────────────────────────────── */}
              <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:24,alignItems:"flex-start",padding:"36px 0 28px",borderBottom:"1px solid var(--border)",marginBottom:28}}>
                <div style={{display:"flex",alignItems:"center",gap:20}}>
                  <div style={{width:64,height:64,borderRadius:16,background:"linear-gradient(135deg,var(--neon),var(--neon2))",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontSize:"1.2rem",fontWeight:800,color:"#03040a",flexShrink:0,boxShadow:"0 0 32px rgba(0,245,196,0.2)"}}>
                    {symbol!.slice(0,2)}
                  </div>
                  <div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:"2rem",fontWeight:800,lineHeight:1}}>{symbol}</div>
                    <div style={{fontSize:"0.9rem",color:"var(--muted)",marginTop:4}}>{data.overview.name}</div>
                    <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
                      {[
                        {v:data.overview.exchange, style:{background:"rgba(0,245,196,.08)",border:"1px solid rgba(0,245,196,.25)",color:"var(--neon)"}},
                        {v:data.overview.sector,   style:{background:"rgba(123,97,255,.1)",border:"1px solid rgba(123,97,255,.3)",color:"var(--neon2)"}},
                        {v:data.overview.country,  style:{background:"rgba(255,255,255,.05)",border:"1px solid var(--border)",color:"var(--muted)"}},
                        {v:data.overview.currency, style:{background:"rgba(255,255,255,.05)",border:"1px solid var(--border)",color:"var(--muted)"}},
                      ].filter(b=>b.v&&b.v!=="—").map(b=>(
                        <span key={b.v} style={{padding:"4px 10px",borderRadius:6,fontSize:"0.68rem",letterSpacing:"1px",textTransform:"uppercase",fontWeight:600,...b.style}}>{b.v}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:"2.8rem",fontWeight:800,lineHeight:1,color:"var(--neon)"}}>
                    {price>0?`$${price.toFixed(2)}`:"N/A"}
                  </div>
                  <div style={{fontSize:"0.95rem",fontWeight:600,padding:"6px 14px",borderRadius:8,
                    background:isUp?"rgba(0,230,118,.1)":"rgba(255,77,109,.1)",
                    color:isUp?"#00e676":"#ff4d6d",
                    border:`1px solid ${isUp?"rgba(0,230,118,.25)":"rgba(255,77,109,.25)"}`}}>
                    {isUp?"▲ +":"▼ "}{Math.abs(change).toFixed(2)} &nbsp; {data.quote.changePct}
                  </div>
                  <div style={{fontSize:"0.75rem",color:"var(--muted)"}}>As of {data.quote.latestDay}</div>
                </div>
              </div>

              {/* ── BUY STRIP ─────────────────────────────── */}
              <div style={{display:"flex",alignItems:"center",gap:16,background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:18,padding:"20px 24px",marginBottom:24,flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:"0.72rem",color:"var(--muted)",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4}}>Market Price</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.5rem",fontWeight:800,color:"var(--neon)"}}>{price>0?`$${price.toFixed(2)}`:"N/A"}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:36,height:36,borderRadius:8,border:"1px solid var(--border)",background:"rgba(255,255,255,.05)",color:"var(--text)",fontSize:"1.1rem",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="var(--neon)";(e.currentTarget as HTMLButtonElement).style.color="var(--neon)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="var(--border)";(e.currentTarget as HTMLButtonElement).style.color="var(--text)";}}>−</button>
                  <input type="number" min={1} value={qty} onChange={e=>setQty(Math.max(1,parseInt(e.target.value)||1))}
                    style={{width:64,textAlign:"center",background:"rgba(0,0,0,.4)",border:"1px solid var(--border)",borderRadius:8,padding:"8px",color:"var(--text)",fontFamily:"'DM Sans',sans-serif",fontSize:"0.95rem",outline:"none"}}
                    onFocus={e=>{(e.currentTarget as HTMLInputElement).style.borderColor="var(--neon)";}}
                    onBlur={e=>{(e.currentTarget as HTMLInputElement).style.borderColor="var(--border)";}}/>
                  <button onClick={()=>setQty(q=>q+1)} style={{width:36,height:36,borderRadius:8,border:"1px solid var(--border)",background:"rgba(255,255,255,.05)",color:"var(--text)",fontSize:"1.1rem",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="var(--neon)";(e.currentTarget as HTMLButtonElement).style.color="var(--neon)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="var(--border)";(e.currentTarget as HTMLButtonElement).style.color="var(--text)";}}>+</button>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"0.72rem",color:"var(--muted)",letterSpacing:"1px",textTransform:"uppercase"}}>Total</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.3rem",fontWeight:800}}>{price>0?`$${(price*qty).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—"}</div>
                </div>
                <button onClick={()=>setShowBuyModal(true)}
                  style={{padding:"14px 36px",borderRadius:12,background:"linear-gradient(135deg,var(--neon),var(--neon2))",color:"#03040a",fontFamily:"'Syne',sans-serif",fontSize:"0.95rem",fontWeight:800,border:"none",cursor:"pointer",transition:"all .3s",letterSpacing:"0.5px",whiteSpace:"nowrap"}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.transform="scale(1.04)";(e.currentTarget as HTMLButtonElement).style.boxShadow="0 0 36px rgba(0,245,196,.35)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.transform="";(e.currentTarget as HTMLButtonElement).style.boxShadow="";}}>
                  Buy {symbol}
                </button>
                <button onClick={()=>setWatchlisted(w=>!w)}
                  style={{padding:"14px 20px",borderRadius:12,border:`1px solid ${watchlisted?"rgba(0,230,118,.4)":"rgba(123,97,255,.4)"}`,background:watchlisted?"rgba(0,230,118,.08)":"rgba(123,97,255,.08)",color:watchlisted?"#00e676":"var(--neon2)",fontFamily:"'DM Sans',sans-serif",fontSize:"0.85rem",fontWeight:600,cursor:"pointer",transition:"all .3s",whiteSpace:"nowrap"}}>
                  {watchlisted?"♥  Watching":"♡  Watchlist"}
                </button>
              </div>

              {/* ── KEY METRICS ───────────────────────────── */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
                {[
                  {label:"Open",     value:data.quote.open>0?`$${data.quote.open.toFixed(2)}`:"N/A",   color:"var(--text)", sub:"Today's open"},
                  {label:"Day High", value:data.quote.high>0?`$${data.quote.high.toFixed(2)}`:"N/A",   color:"#00e676",     sub:"Intraday high"},
                  {label:"Day Low",  value:data.quote.low>0?`$${data.quote.low.toFixed(2)}`:"N/A",    color:"#ff4d6d",     sub:"Intraday low"},
                  {label:"Volume",   value:data.quote.volume>0?`${(data.quote.volume/1e6).toFixed(2)}M`:"N/A", color:"var(--text)", sub:"Shares traded"},
                ].map((m,i) => (
                  <div key={i} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:14,padding:"18px 16px"}}>
                    <div style={{fontSize:"0.65rem",color:"var(--muted)",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:8}}>{m.label}</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.35rem",fontWeight:800,lineHeight:1.1,color:m.color}}>{m.value}</div>
                    <div style={{fontSize:"0.72rem",color:"var(--muted)",marginTop:4}}>{m.sub}</div>
                  </div>
                ))}
              </div>

              {/* ── CHART + STATS SIDEBAR ─────────────────── */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20,marginBottom:20}}>

                {/* Chart */}
                <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:18,padding:24}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:20}}>
                    <div style={{width:3,height:16,borderRadius:2,background:"var(--neon)",flexShrink:0}}/>
                    <span style={{fontFamily:"'Syne',sans-serif",fontSize:"1rem",fontWeight:700}}>Price History</span>
                  </div>
                  <div style={{display:"flex",gap:6,marginBottom:20}}>
                    {RANGES.map(r=>(
                      <button key={r.label} onClick={()=>setRange(r.days)}
                        style={{padding:"7px 16px",borderRadius:8,fontSize:"0.78rem",fontWeight:600,cursor:"pointer",transition:"all .25s",
                          background:range===r.days?"rgba(0,245,196,.1)":"transparent",
                          border:`1px solid ${range===r.days?"rgba(0,245,196,.4)":"var(--border)"}`,
                          color:range===r.days?"var(--neon)":"var(--muted)"}}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div style={{height:320,position:"relative"}}>
                    {chartDataset ? (
                      <Line ref={chartRef} data={buildChartData()} options={chartOptions}/>
                    ) : (
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--muted)"}}>Chart data unavailable</div>
                    )}
                  </div>
                </div>

                {/* Stats sidebar */}
                <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:18,padding:24}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:20}}>
                    <div style={{width:3,height:16,borderRadius:2,background:"var(--neon)",flexShrink:0}}/>
                    <span style={{fontFamily:"'Syne',sans-serif",fontSize:"1rem",fontWeight:700}}>Trading Stats</span>
                  </div>
                  <StatRow label="Prev Close"     value={fmtDollar(data.quote.prevClose)} />
                  <StatRow label="52W High"       value={data.overview.week52High!=="—"?`$${data.overview.week52High}`:"—"} accent="up"/>
                  <StatRow label="52W Low"        value={data.overview.week52Low!=="—"?`$${data.overview.week52Low}`:"—"} accent="dn"/>
                  <StatRow label="Market Cap"     value={fmtB(data.overview.marketCap)} accent="neon"/>
                  <StatRow label="P/E Ratio"      value={fmtPlain(data.overview.pe)} />
                  <StatRow label="EPS"            value={fmtDollar(data.overview.eps)} />
                  <StatRow label="Beta"           value={fmtPlain(data.overview.beta)} />
                  <StatRow label="Dividend Yield" value={fmtPlain(data.overview.divYield)} />
                  <StatRow label="Analyst Target" value={fmtDollar(data.overview.analystTarget)} accent="neon"/>
                  <StatRow label="Profit Margin"  value={fmtPlain(data.overview.profitMargin)} />
                  <div style={{borderBottom:"none",paddingBottom:0}}>
                    <StatRow label="Shares Out." value={fmtB(data.overview.sharesOutstanding)} />
                  </div>

                  {show52 && (
                    <div style={{marginTop:16}}>
                      <div style={{fontSize:"0.75rem",color:"var(--muted)",letterSpacing:"0.5px",marginBottom:6}}>52-Week Range</div>
                      <div style={{height:6,borderRadius:3,background:"rgba(255,255,255,.08)",position:"relative",margin:"8px 0",overflow:"visible"}}>
                        <div style={{height:"100%",borderRadius:3,background:"linear-gradient(90deg,var(--neon2),var(--neon))",width:`${pct52.toFixed(1)}%`}}/>
                        <div style={{position:"absolute",top:"50%",transform:"translateY(-50%)",width:14,height:14,borderRadius:"50%",background:"var(--neon)",border:"2px solid var(--bg)",boxShadow:"0 0 10px rgba(0,245,196,.5)",left:`calc(${pct52.toFixed(1)}% - 7px)`}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.7rem",color:"var(--muted)"}}>
                        <span>${lo52.toFixed(2)}</span><span>${hi52.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── COMPANY INFO + ABOUT ──────────────────── */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:14,marginBottom:20}}>
                <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:18,padding:24}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:20}}>
                    <div style={{width:3,height:16,borderRadius:2,background:"var(--neon)",flexShrink:0}}/>
                    <span style={{fontFamily:"'Syne',sans-serif",fontSize:"1rem",fontWeight:700}}>Company Info</span>
                  </div>
                  <StatRow label="Industry"       value={fmtPlain(data.overview.industry)} />
                  <StatRow label="Exchange"       value={fmtPlain(data.overview.exchange)} />
                  <StatRow label="Country"        value={fmtPlain(data.overview.country)} />
                  <StatRow label="Currency"       value={fmtPlain(data.overview.currency)} />
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0"}}>
                    <span style={{fontSize:"0.75rem",color:"var(--muted)"}}>Revenue/Share</span>
                    <span style={{fontSize:"0.9rem",fontWeight:600}}>{fmtDollar(data.overview.revenuePerShare)}</span>
                  </div>
                </div>

                <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:18,padding:24}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:20}}>
                    <div style={{width:3,height:16,borderRadius:2,background:"var(--neon)",flexShrink:0}}/>
                    <span style={{fontFamily:"'Syne',sans-serif",fontSize:"1rem",fontWeight:700}}>About {data.overview.name}</span>
                  </div>
                  <p style={{fontSize:"0.88rem",color:"var(--muted)",lineHeight:1.8,fontStyle:data.overview.description?"normal":"italic"}}>
                    {data.overview.description || "No description available for this company."}
                  </p>
                </div>
              </div>

              {/* ── NEWS ──────────────────────────────────── */}
              <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:18,padding:24}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:20}}>
                  <div style={{width:3,height:16,borderRadius:2,background:"var(--neon)",flexShrink:0}}/>
                  <span style={{fontFamily:"'Syne',sans-serif",fontSize:"1rem",fontWeight:700}}>Latest News</span>
                </div>
                {data.news.length === 0 ? (
                  <div style={{textAlign:"center",padding:"40px 20px",color:"var(--muted)",fontSize:"0.9rem"}}>No recent news found for {symbol}.</div>
                ) : data.news.map((n, i) => {
                  const sentColor = n.sentiment==="Positive"?"#00e676":n.sentiment==="Negative"?"#ff4d6d":"var(--neon2)";
                  return (
                    <div key={i} style={{display:"flex",gap:14,padding:"14px 0",borderBottom:i<data.news.length-1?"1px solid var(--border)":"none"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:sentColor,flexShrink:0,marginTop:6}}/>
                      <div>
                        <div style={{fontSize:"0.88rem",fontWeight:600,lineHeight:1.4,marginBottom:4}}>
                          <a href={n.url} target="_blank" rel="noopener noreferrer"
                            style={{color:"var(--text)",textDecoration:"none",transition:"color .2s"}}
                            onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color="var(--neon)";}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color="var(--text)";}}>
                            {n.title}
                          </a>
                        </div>
                        <div style={{fontSize:"0.72rem",color:"var(--muted)",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                          <span>{n.source}</span>
                          {n.published && <><span>·</span><span>{n.published}</span></>}
                          <span style={{padding:"2px 8px",borderRadius:4,fontSize:"0.65rem",fontWeight:600,textTransform:"uppercase",
                            background:n.sentiment==="Positive"?"rgba(0,230,118,.12)":n.sentiment==="Negative"?"rgba(255,77,109,.12)":"rgba(255,255,255,.06)",
                            color:sentColor}}>
                            {n.sentiment}
                          </span>
                        </div>
                        {n.summary && <p style={{fontSize:"0.8rem",color:"var(--muted)",marginTop:6,lineHeight:1.6}}>{n.summary}…</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── BUY MODAL ──────────────────────────────────────── */}
      {showBuyModal && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowBuyModal(false);}}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",justifyContent:"center",alignItems:"center",zIndex:99999,backdropFilter:"blur(10px)"}}>
          <div style={{width:420,maxWidth:"96vw",background:"#0f172a",border:"1px solid rgba(255,255,255,0.08)",borderRadius:24,padding:30,color:"white",fontFamily:"sans-serif"}}>

            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <h2 style={{fontSize:28,margin:0,fontWeight:800}}>
                Buy <span style={{color:"#00f5c4"}}>{symbol}</span>
              </h2>
              <button onClick={()=>setShowBuyModal(false)} style={{width:40,height:40,border:"none",borderRadius:12,background:"rgba(255,255,255,0.06)",color:"white",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>

            {/* Price */}
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:18,marginBottom:18}}>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.1em"}}>Current Price</div>
              <div style={{fontSize:24,fontWeight:700,color:"#00f5c4"}}>{price>0?`$${price.toFixed(2)}`:"N/A"}</div>
            </div>

            {/* Quantity */}
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:18,marginBottom:18}}>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.1em"}}>Quantity</div>
              <input type="number" min={1} value={qty} onChange={e=>setQty(Math.max(1,parseInt(e.target.value)||1))}
                style={{width:"100%",marginTop:10,padding:14,border:"none",borderRadius:14,background:"#111827",color:"white",fontFamily:"'DM Sans',sans-serif",fontSize:18,outline:"none"}}/>
            </div>

            {/* Total */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,padding:18,borderRadius:16,
              background:"linear-gradient(135deg,rgba(0,245,196,0.08),rgba(123,97,255,0.08))"}}>
              <span>Total Amount</span>
              <strong style={{fontSize:28}}>{price>0?`$${(price*qty).toFixed(2)}`:"—"}</strong>
            </div>

            {/* Confirm */}
            <button onClick={confirmBuy} disabled={buying||!price}
              style={{width:"100%",padding:16,border:"none",borderRadius:16,
                background:"linear-gradient(135deg,#00f5c4,#7b61ff)",
                color:"#03040a",fontWeight:800,fontSize:16,cursor:!price?"not-allowed":"pointer",
                opacity:!price?0.5:1,transition:"all .25s"}}>
              {buying ? "Processing…" : "Confirm Purchase"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
