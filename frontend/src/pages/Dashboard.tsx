import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard, getStockPrice } from "../services/api";
import Sidebar from "../components/Sidebar";

/* ── Types ─────────────────────────────────────────────── */
interface DashUser { name: string; username: string; role: string; initials: string; }

interface StockEntry {
  symbol: string; name: string; sector: string;
  priceUSD: number; change: number;
  logoA: string; logoB: string; initials: string;
}

/* ── Static universe ───────────────────────────────────── */
const STOCK_UNIVERSE: StockEntry[] = [
  { symbol:"AAPL",  name:"Apple Inc",              sector:"technology", priceUSD:212.80, change:1.26,  logoA:"#555",   logoB:"#aaa",   initials:"AA" },
  { symbol:"MSFT",  name:"Microsoft Corp",         sector:"technology", priceUSD:415.60, change:-0.12, logoA:"#00A4EF",logoB:"#7FBA00",initials:"MS" },
  { symbol:"NVDA",  name:"NVIDIA Corp",            sector:"technology", priceUSD:875.80, change:2.14,  logoA:"#76B900",logoB:"#004600",initials:"NV" },
  { symbol:"GOOGL", name:"Alphabet Inc",           sector:"technology", priceUSD:175.60, change:-1.21, logoA:"#4285F4",logoB:"#EA4335",initials:"GO" },
  { symbol:"META",  name:"Meta Platforms",         sector:"technology", priceUSD:700.55, change:0.47,  logoA:"#0081FB",logoB:"#00C6FF",initials:"ME" },
  { symbol:"TSLA",  name:"Tesla Inc",              sector:"technology", priceUSD:248.00, change:1.95,  logoA:"#CC0000",logoB:"#FF4444",initials:"TS" },
  { symbol:"AMZN",  name:"Amazon.com Inc",         sector:"technology", priceUSD:191.90, change:0.83,  logoA:"#FF9900",logoB:"#232F3E",initials:"AM" },
  { symbol:"AMD",   name:"Advanced Micro Devices", sector:"technology", priceUSD:135.80, change:3.99,  logoA:"#ED1C24",logoB:"#FF6B6B",initials:"AM" },
  { symbol:"ORCL",  name:"Oracle Corp",            sector:"technology", priceUSD:125.00, change:0.55,  logoA:"#F80000",logoB:"#CC0000",initials:"OR" },
  { symbol:"NFLX",  name:"Netflix Inc",            sector:"technology", priceUSD:645.00, change:1.78,  logoA:"#E50914",logoB:"#221F1F",initials:"NF" },
  { symbol:"CRM",   name:"Salesforce Inc",         sector:"technology", priceUSD:290.00, change:0.44,  logoA:"#00A1E0",logoB:"#0070D2",initials:"CR" },
  { symbol:"INTC",  name:"Intel Corp",             sector:"technology", priceUSD:30.50,  change:-1.20, logoA:"#0071C5",logoB:"#004999",initials:"IN" },
  { symbol:"ADBE",  name:"Adobe Inc",              sector:"technology", priceUSD:430.00, change:0.65,  logoA:"#FF0000",logoB:"#CC0000",initials:"AD" },
  { symbol:"CSCO",  name:"Cisco Systems",          sector:"technology", priceUSD:52.40,  change:0.30,  logoA:"#1BA0D7",logoB:"#005073",initials:"CS" },
  { symbol:"IBM",   name:"IBM Corp",               sector:"technology", priceUSD:188.00, change:0.22,  logoA:"#054ADA",logoB:"#1F70C1",initials:"IB" },
  { symbol:"JPM",   name:"JPMorgan Chase",         sector:"finance",    priceUSD:201.00, change:1.12,  logoA:"#003087",logoB:"#0062CC",initials:"JP" },
  { symbol:"BAC",   name:"Bank of America",        sector:"finance",    priceUSD:38.80,  change:0.64,  logoA:"#E31837",logoB:"#012169",initials:"BA" },
  { symbol:"GS",    name:"Goldman Sachs",          sector:"finance",    priceUSD:468.40, change:-0.18, logoA:"#6699BB",logoB:"#004A87",initials:"GS" },
  { symbol:"MS",    name:"Morgan Stanley",         sector:"finance",    priceUSD:102.50, change:0.45,  logoA:"#003087",logoB:"#005DAA",initials:"MS" },
  { symbol:"V",     name:"Visa Inc",               sector:"finance",    priceUSD:276.90, change:-0.68, logoA:"#1A1F71",logoB:"#F7B600",initials:"V"  },
  { symbol:"MA",    name:"Mastercard Inc",         sector:"finance",    priceUSD:468.00, change:0.92,  logoA:"#EB001B",logoB:"#F79E1B",initials:"MA" },
  { symbol:"AXP",   name:"American Express",       sector:"finance",    priceUSD:242.00, change:0.55,  logoA:"#016FD0",logoB:"#003087",initials:"AX" },
  { symbol:"BLK",   name:"BlackRock Inc",          sector:"finance",    priceUSD:860.00, change:0.28,  logoA:"#111",   logoB:"#333",   initials:"BL" },
  { symbol:"C",     name:"Citigroup Inc",          sector:"finance",    priceUSD:65.40,  change:-0.42, logoA:"#003B70",logoB:"#0072CE",initials:"CI" },
  { symbol:"WFC",   name:"Wells Fargo",            sector:"finance",    priceUSD:57.80,  change:0.33,  logoA:"#CC0000",logoB:"#990000",initials:"WF" },
  { symbol:"JNJ",   name:"Johnson & Johnson",      sector:"healthcare", priceUSD:158.60, change:-0.32, logoA:"#CC0000",logoB:"#990000",initials:"JN" },
  { symbol:"UNH",   name:"UnitedHealth Group",     sector:"healthcare", priceUSD:490.90, change:-0.45, logoA:"#00599C",logoB:"#003E6B",initials:"UH" },
  { symbol:"LLY",   name:"Eli Lilly",              sector:"healthcare", priceUSD:780.00, change:1.10,  logoA:"#D52B1E",logoB:"#8B0000",initials:"EL" },
  { symbol:"PFE",   name:"Pfizer Inc",             sector:"healthcare", priceUSD:28.20,  change:-0.88, logoA:"#00559F",logoB:"#003A6C",initials:"PF" },
  { symbol:"MRK",   name:"Merck & Co",             sector:"healthcare", priceUSD:104.70, change:0.72,  logoA:"#009A44",logoB:"#005C26",initials:"MR" },
  { symbol:"ABBV",  name:"AbbVie Inc",             sector:"healthcare", priceUSD:168.00, change:0.38,  logoA:"#071D49",logoB:"#003087",initials:"AB" },
  { symbol:"TMO",   name:"Thermo Fisher",          sector:"healthcare", priceUSD:530.00, change:0.15,  logoA:"#0073CF",logoB:"#004F9F",initials:"TM" },
  { symbol:"AMGN",  name:"Amgen Inc",              sector:"healthcare", priceUSD:290.00, change:-0.22, logoA:"#003087",logoB:"#0062CC",initials:"AG" },
  { symbol:"WMT",   name:"Walmart Inc",            sector:"consumer",   priceUSD:68.40,  change:0.21,  logoA:"#0071CE",logoB:"#FFC220",initials:"WM" },
  { symbol:"COST",  name:"Costco Wholesale",       sector:"consumer",   priceUSD:890.00, change:0.55,  logoA:"#005DAA",logoB:"#E31837",initials:"CO" },
  { symbol:"MCD",   name:"McDonald's Corp",        sector:"consumer",   priceUSD:290.00, change:0.18,  logoA:"#FFC72C",logoB:"#DA291C",initials:"MC" },
  { symbol:"SBUX",  name:"Starbucks Corp",         sector:"consumer",   priceUSD:82.00,  change:-0.44, logoA:"#00704A",logoB:"#1E3932",initials:"SB" },
  { symbol:"NKE",   name:"Nike Inc",               sector:"consumer",   priceUSD:75.00,  change:-0.62, logoA:"#111",   logoB:"#333",   initials:"NK" },
  { symbol:"KO",    name:"Coca-Cola Co",           sector:"consumer",   priceUSD:63.00,  change:0.14,  logoA:"#F40009",logoB:"#CC0000",initials:"KO" },
  { symbol:"HD",    name:"Home Depot",             sector:"consumer",   priceUSD:345.00, change:0.42,  logoA:"#F96302",logoB:"#CC4E00",initials:"HD" },
  { symbol:"XOM",   name:"ExxonMobil",             sector:"energy",     priceUSD:112.00, change:0.65,  logoA:"#FF0000",logoB:"#CC0000",initials:"XO" },
  { symbol:"CVX",   name:"Chevron Corp",           sector:"energy",     priceUSD:148.00, change:0.44,  logoA:"#009BDE",logoB:"#0072AA",initials:"CV" },
  { symbol:"NEE",   name:"NextEra Energy",         sector:"energy",     priceUSD:71.00,  change:0.28,  logoA:"#009CDE",logoB:"#007EB5",initials:"NE" },
  { symbol:"COP",   name:"ConocoPhillips",         sector:"energy",     priceUSD:98.00,  change:-0.32, logoA:"#CC0000",logoB:"#990000",initials:"CP" },
  { symbol:"RIVN",  name:"Rivian Automotive",      sector:"ev",         priceUSD:14.50,  change:3.20,  logoA:"#00A878",logoB:"#007A56",initials:"RV" },
  { symbol:"GM",    name:"General Motors",         sector:"ev",         priceUSD:46.00,  change:0.55,  logoA:"#0161A4",logoB:"#013F6B",initials:"GM" },
  { symbol:"F",     name:"Ford Motor Co",          sector:"ev",         priceUSD:11.50,  change:-0.88, logoA:"#003298",logoB:"#001F5B",initials:"FD" },
  { symbol:"UBER",  name:"Uber Technologies",      sector:"ev",         priceUSD:72.00,  change:1.22,  logoA:"#111",   logoB:"#333",   initials:"UB" },
  { symbol:"DIS",   name:"Walt Disney Co",         sector:"media",      priceUSD:96.00,  change:0.30,  logoA:"#006E99",logoB:"#003C57",initials:"DI" },
  { symbol:"SPOT",  name:"Spotify Technology",     sector:"media",      priceUSD:340.00, change:2.10,  logoA:"#1DB954",logoB:"#158A3E",initials:"SP" },
  { symbol:"EA",    name:"Electronic Arts",        sector:"media",      priceUSD:128.00, change:0.42,  logoA:"#FF4500",logoB:"#CC3700",initials:"EA" },
];

const CRYPTO_UNIVERSE: StockEntry[] = [
  { symbol:"BTC",  name:"Bitcoin",       sector:"defi", priceUSD:68400, change:2.15,  logoA:"#F7931A",logoB:"#FF6B00",initials:"BT" },
  { symbol:"ETH",  name:"Ethereum",      sector:"defi", priceUSD:3850,  change:1.82,  logoA:"#627EEA",logoB:"#8A92B2",initials:"ET" },
  { symbol:"SOL",  name:"Solana",        sector:"defi", priceUSD:172,   change:3.41,  logoA:"#9945FF",logoB:"#14F195",initials:"SO" },
  { symbol:"BNB",  name:"Binance Coin",  sector:"defi", priceUSD:580,   change:0.95,  logoA:"#F3BA2F",logoB:"#CC9900",initials:"BN" },
  { symbol:"XRP",  name:"XRP",           sector:"defi", priceUSD:0.54,  change:-1.20, logoA:"#00AAE4",logoB:"#006B9F",initials:"XR" },
  { symbol:"AVAX", name:"Avalanche",     sector:"defi", priceUSD:39.8,  change:4.10,  logoA:"#E84142",logoB:"#8B0000",initials:"AV" },
  { symbol:"DOGE", name:"Dogecoin",      sector:"meme", priceUSD:0.18,  change:5.55,  logoA:"#C2A633",logoB:"#8B7500",initials:"DO" },
  { symbol:"ADA",  name:"Cardano",       sector:"defi", priceUSD:0.61,  change:-0.80, logoA:"#0033AD",logoB:"#001F6B",initials:"AD" },
];

const RATES: Record<string, number>   = { INR:83.5, USD:1, EUR:0.92, GBP:0.79 };
const SYMBOLS: Record<string, string> = { INR:"₹",  USD:"$",EUR:"€",  GBP:"£"  };
const CATS_STOCK = ["all","technology","finance","healthcare","consumer","energy","ev","media"];
const PAGE_SIZE = 51;

/* ── Helpers ───────────────────────────────────────────── */
function fmt(usd: number, cur: string) {
  const v = usd * RATES[cur];
  return SYMBOLS[cur] + v.toLocaleString("en-IN", { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function range(usd: number, chg: number) {
  const open = usd / (1 + chg / 100);
  return { open, low: open * 0.995, high: usd * 1.005 };
}

/* ── Component ─────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [dashUser, setDashUser]   = useState<DashUser | null>(null);
  const [universe, setUniverse]   = useState<StockEntry[]>(STOCK_UNIVERSE);
  const [mode, setMode]           = useState<"stocks"|"crypto">("stocks");
  const [category, setCategory]   = useState("all");
  const [search, setSearch]       = useState("");
  const [sortKey, setSortKey]     = useState("popular");
  const [sortDir, setSortDir]     = useState<"asc"|"desc">("desc");
  const [currency, setCurrency]   = useState("INR");
  const [page, setPage]           = useState(1);
  const [livePrices, setLivePrices] = useState<Record<string,number>>({});

  /* ── Load user ────────────────────────────────────────── */
  useEffect(() => {
    getDashboard().then(r => setDashUser(r.data.user)).catch(() => {});
  }, []);

  /* ── Fetch live prices for top stocks ─────────────────── */
  useEffect(() => {
    if (mode !== "stocks") return;
    const TOP = ["AAPL","MSFT","NVDA","TSLA","META","AMZN","GOOGL"];
    TOP.forEach((sym, i) => {
      setTimeout(() => {
        getStockPrice(sym)
          .then(r => { if (r.data.success) setLivePrices(p => ({ ...p, [sym]: r.data.price })); })
          .catch(() => {});
      }, i * 800);
    });
  }, [mode]);

  /* ── Merge live prices into universe ──────────────────── */
  useEffect(() => {
    if (mode === "stocks" && Object.keys(livePrices).length) {
      setUniverse(STOCK_UNIVERSE.map(s =>
        livePrices[s.symbol] ? { ...s, priceUSD: livePrices[s.symbol] } : s
      ));
    }
  }, [livePrices, mode]);

  /* ── Switch universe on mode change ──────────────────── */
  useEffect(() => {
    setUniverse(mode === "crypto" ? CRYPTO_UNIVERSE : STOCK_UNIVERSE);
    setCategory("all");
    setPage(1);
  }, [mode]);

  /* ── Particle canvas ──────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = 0, H = 0;
    let raf: number;
    let mx = -9999, my = -9999;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const PAL = ["#00f5c4","#7b61ff","#ff6b6b"];
    const pts = Array.from({ length:80 }, () => ({
      x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight,
      r: Math.random()*1.4+0.3,
      vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3,
      a: Math.random()*.28+.06, col:PAL[Math.floor(Math.random()*PAL.length)],
    }));

    const onMouse = (e: MouseEvent) => { mx=e.clientX; my=e.clientY; };
    window.addEventListener("mousemove", onMouse);

    const draw = () => {
      ctx.clearRect(0,0,W,H);
      for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++) {
        const d=Math.hypot(pts[i].x-pts[j].x, pts[i].y-pts[j].y);
        if (d<110) { ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.strokeStyle="#00f5c4"; ctx.globalAlpha=(1-d/110)*.045; ctx.lineWidth=.5; ctx.stroke(); }
      }
      pts.forEach(p => {
        const dx=p.x-mx, dy=p.y-my, d=Math.hypot(dx,dy);
        if (d<120) { const f=((120-d)/120)*.4; p.vx+=(dx/d)*f; p.vy+=(dy/d)*f; }
        p.vx*=.985; p.vy*=.985; p.x+=p.vx; p.y+=p.vy;
        if (p.x<0||p.x>W) p.vx*=-1; if (p.y<0||p.y>H) p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.globalAlpha=p.a; ctx.fillStyle=p.col; ctx.fill();
      });
      ctx.globalAlpha=1;
      raf=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",resize); window.removeEventListener("mousemove",onMouse); };
  }, []);

  /* ── Filtered + sorted list ───────────────────────────── */
  const all = useMemo(() => {
    const q = search.trim().toLowerCase();
    let data = universe.filter(s =>
      (category === "all" || s.sector === category) &&
      (!q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    );
    return [...data].sort((a, b) => {
      let diff = 0;
      if (sortKey === "price_high" || sortKey === "price_low") diff = a.priceUSD - b.priceUSD;
      else if (sortKey === "change_up" || sortKey === "change_down") diff = a.change - b.change;
      else diff = b.priceUSD - a.priceUSD;
      return sortDir === "desc" ? -diff : diff;
    });
  }, [universe, category, search, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const slice = all.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const cats = mode === "crypto"
    ? ["all","defi","meme"]
    : CATS_STOCK;

  return (
    <>
      <canvas ref={canvasRef} style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none" }} />
      <div className="aurora"><div className="ab"/><div className="ab"/><div className="ab"/></div>
      <div className="grid-lines"/>
      <Sidebar active="dashboard" user={dashUser}/>

      <div className="page-wrap">
        {/* Live bar */}
        <div className="live-bar">
          <div className="live-dot"/><span className="live-text">Live</span>
          <span>Real-time market data</span>
        </div>

        {/* Topbar */}
        <div className="topbar">
          <div>
            <h1>Explore</h1>
            <p>Welcome back, {dashUser?.name ?? "Trader"}</p>
          </div>
          <div className="tb-right" style={{ gap:10 }}>

            {/* Stocks / Crypto toggle */}
            <div style={{ display:"flex",gap:4,background:"rgba(255,255,255,0.04)",border:"1px solid var(--border)",borderRadius:8,padding:4 }}>
              {(["stocks","crypto"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{ padding:"6px 14px",borderRadius:6,fontSize:"0.8rem",fontWeight:600,border:"none",cursor:"pointer",background:mode===m?"var(--neon)":"transparent",color:mode===m?"#03040a":"var(--muted)",transition:"all 0.2s" }}>
                  {m === "stocks" ? "📈 Stocks" : "₿ Crypto"}
                </button>
              ))}
            </div>

            {/* Currency */}
            <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",color:"var(--text)",fontSize:"0.82rem",fontFamily:"inherit",outline:"none",cursor:"pointer" }}>
              {["INR","USD","EUR","GBP"].map(c => <option key={c} value={c} style={{ background:"#0d0f1a" }}>{c}</option>)}
            </select>

            {/* User avatar */}
            <div className="tb-user">{dashUser?.initials ?? "U"}</div>
          </div>
        </div>

        {/* Filters bar */}
        <div style={{ padding:"16px 36px",borderBottom:"1px solid var(--border)",background:"rgba(255,255,255,0.015)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",position:"sticky",top:69,zIndex:30,backdropFilter:"blur(20px)" }}>

          {/* Search */}
          <div style={{ position:"relative",flex:"1",minWidth:200 }}>
            <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--muted)",fontSize:"0.9rem" }}>🔍</span>
            <input className="input-field" style={{ paddingLeft:36,fontSize:"0.88rem",height:38 }}
              placeholder="Search symbol or name…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Category pills */}
          <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
            {cats.map(c => (
              <button key={c} onClick={() => { setCategory(c); setPage(1); }} style={{ padding:"6px 14px",borderRadius:20,fontSize:"0.78rem",fontWeight:600,border:`1px solid ${category===c?"var(--neon)":"var(--border)"}`,background:category===c?"rgba(0,245,196,0.12)":"transparent",color:category===c?"var(--neon)":"var(--muted)",cursor:"pointer",transition:"all 0.2s",textTransform:"capitalize" }}>
                {c}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display:"flex",gap:6,marginLeft:"auto" }}>
            <select value={sortKey} onChange={e => { setSortKey(e.target.value); setPage(1); }} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 12px",color:"var(--text)",fontSize:"0.82rem",fontFamily:"inherit",outline:"none",cursor:"pointer" }}>
              <option value="popular"     style={{ background:"#0d0f1a" }}>Popular</option>
              <option value="price_high"  style={{ background:"#0d0f1a" }}>Price High→Low</option>
              <option value="price_low"   style={{ background:"#0d0f1a" }}>Price Low→High</option>
              <option value="change_up"   style={{ background:"#0d0f1a" }}>Best Gainers</option>
              <option value="change_down" style={{ background:"#0d0f1a" }}>Biggest Losers</option>
            </select>
            <button onClick={() => setSortDir(d => d==="desc"?"asc":"desc")} style={{ padding:"7px 14px",borderRadius:8,fontSize:"0.78rem",fontWeight:600,border:"1px solid rgba(0,245,196,0.3)",background:"rgba(0,245,196,0.07)",color:"var(--neon)",cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap" }}>
              {sortDir==="desc" ? "High → Low" : "Low → High"}
            </button>
          </div>
        </div>

        {/* Results meta */}
        <div style={{ padding:"12px 36px",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:"0.8rem",color:"var(--muted)" }}>
          <span>Showing <strong style={{ color:"var(--text)" }}>{slice.length}</strong> of <strong style={{ color:"var(--text)" }}>{all.length}</strong> {mode}</span>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page<=1} style={{ padding:"5px 14px",borderRadius:7,fontSize:"0.78rem",border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:page<=1?"not-allowed":"pointer",opacity:page<=1?.4:1 }}>Previous</button>
            <span>Page <strong style={{ color:"var(--text)" }}>{page}</strong> / <strong style={{ color:"var(--text)" }}>{pages}</strong></span>
            <button onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page>=pages} style={{ padding:"5px 14px",borderRadius:7,fontSize:"0.78rem",border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:page>=pages?"not-allowed":"pointer",opacity:page>=pages?.4:1 }}>Next</button>
          </div>
        </div>

        {/* Stock grid */}
        <div style={{ padding:"4px 36px 60px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16,position:"relative",zIndex:1 }}>
          {slice.length === 0 ? (
            <div style={{ gridColumn:"1/-1",textAlign:"center",padding:"80px 0",color:"var(--muted)" }}>
              <div style={{ fontSize:"2.5rem",marginBottom:12 }}>🔍</div>
              <p style={{ fontSize:"1rem" }}>No results match your search.</p>
            </div>
          ) : slice.map((s, i) => {
            const { open, low, high } = range(s.priceUSD, s.change);
            const isUp = s.change >= 0;
            return (
              <div key={s.symbol + i} onClick={() => navigate(`/stock/${s.symbol}`)}
                style={{ background:"rgba(255,255,255,0.03)",border:"1px solid var(--border)",borderRadius:18,padding:22,cursor:"pointer",position:"relative",overflow:"hidden",transition:"transform 0.3s, border-color 0.3s, box-shadow 0.3s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform="translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.borderColor="rgba(0,245,196,0.25)"; (e.currentTarget as HTMLDivElement).style.boxShadow="0 20px 50px rgba(0,0,0,0.5)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform=""; (e.currentTarget as HTMLDivElement).style.borderColor="var(--border)"; (e.currentTarget as HTMLDivElement).style.boxShadow=""; }}
              >
                {/* Accent bar */}
                <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.logoA},transparent)`,opacity:0.7 }}/>

                {/* Header */}
                <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
                  <div style={{ width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${s.logoA},${s.logoB})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.72rem",fontWeight:800,color:"#fff",flexShrink:0,letterSpacing:"-0.5px",textShadow:"0 1px 2px rgba(0,0,0,0.5)" }}>
                    {s.initials}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"0.98rem" }}>{s.symbol}</div>
                    <div style={{ color:"var(--muted)",fontSize:"0.7rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.name.toUpperCase()}</div>
                  </div>
                </div>

                {/* Price */}
                <Row label="Price" value={fmt(s.priceUSD, currency)} big neon />
                <Row label="Change"   value={`${isUp?"+":""}${s.change.toFixed(2)}%`} color={isUp?"#4ade80":"var(--neon3)"} />
                <Row label="Day Range" value={`${fmt(low,currency)} – ${fmt(high,currency)}`} small />
                <Row label="Open"      value={fmt(open, currency)} />
                <Row label="Prev Close" value={fmt(s.priceUSD/(1+s.change/100),currency)} last />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ── Row sub-component ─────────────────────────────────── */
function Row({ label, value, big, neon, small, color, last }: {
  label: string; value: string;
  big?: boolean; neon?: boolean; small?: boolean; color?: string; last?: boolean;
}) {
  return (
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:`${big?"10px":"7px"} 0`,borderBottom:last?"none":"1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize:"0.7rem",color:"var(--muted)",letterSpacing:"0.04em" }}>{label}</span>
      <span style={{ fontSize:big?"1.05rem":small?"0.75rem":"0.88rem",fontWeight:big?800:600,color:neon?"var(--neon)":color||"var(--text)",fontFamily:big?"'Syne',sans-serif":"inherit" }}>{value}</span>
    </div>
  );
}
