import { useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  {
    icon: "⚡",
    color: "#00f5c4",
    label: "Real-Time Prices",
    desc: "Live stock prices powered by Yahoo Finance, refreshed every 15 seconds across all your holdings.",
  },
  {
    icon: "📈",
    color: "#7b61ff",
    label: "Virtual Trading",
    desc: "Buy and sell stocks with a simulated balance. Practice strategies with zero financial risk.",
  },
  {
    icon: "💼",
    color: "#ffb800",
    label: "Portfolio Analytics",
    desc: "Track P&L, asset allocation, and performance with beautiful charts and breakdowns.",
  },
  {
    icon: "📰",
    color: "#ff6b6b",
    label: "Market News",
    desc: "Curated financial news with AI sentiment analysis — Positive, Neutral, or Negative.",
  },
  {
    icon: "📊",
    color: "#00e676",
    label: "Stock Explorer",
    desc: "Discover 50+ stocks across Technology, Finance, Healthcare, Consumer, Energy and more.",
  },
  {
    icon: "🔍",
    color: "#38bdf8",
    label: "Deep Stock Info",
    desc: "Full company profiles, price history charts, key metrics, 52-week ranges, and EPS data.",
  },
];

const STATS = [
  { value: "50+",   label: "Stocks Tracked" },
  { value: "Live",  label: "Price Updates"  },
  { value: "100%",  label: "Free to Use"    },
  { value: "Dark",  label: "Mode Only 😎"   },
];

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!loading && user) navigate("/explore");
  }, [user, loading, navigate]);

  /* particle canvas */
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;
    let W=0,H=0,raf=0,mx=-9999,my=-9999;
    const resize=()=>{W=cv.width=window.innerWidth;H=cv.height=window.innerHeight;};
    resize(); window.addEventListener("resize",resize);
    const PAL=["#00f5c4","#7b61ff","#ff6b6b"];
    const pts=Array.from({length:70},()=>({
      x:Math.random()*window.innerWidth, y:Math.random()*window.innerHeight,
      r:Math.random()*1.2+.3, vx:(Math.random()-.5)*.25, vy:(Math.random()-.5)*.25,
      a:Math.random()*.22+.05, col:PAL[Math.floor(Math.random()*3)],
    }));
    const onM=(e:MouseEvent)=>{mx=e.clientX;my=e.clientY;};
    window.addEventListener("mousemove",onM);
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y);
        if(d<100){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle="#00f5c4";ctx.globalAlpha=(1-d/100)*.04;ctx.lineWidth=.5;ctx.stroke();}
      }
      pts.forEach(p=>{
        const dx=p.x-mx,dy=p.y-my,d=Math.hypot(dx,dy);
        if(d<120){const f=((120-d)/120)*.35;p.vx+=(dx/d)*f;p.vy+=(dy/d)*f;}
        p.vx*=.984;p.vy*=.984;p.x+=p.vx;p.y+=p.vy;
        if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.globalAlpha=p.a;ctx.fillStyle=p.col;ctx.fill();
      });
      ctx.globalAlpha=1; raf=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);window.removeEventListener("mousemove",onM);};
  },[]);

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse    { 0%,100%{box-shadow:0 0 0 0 rgba(0,245,196,.4)} 50%{box-shadow:0 0 0 8px rgba(0,245,196,0)} }
        @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .home-hero   { animation: fadeUp .8s ease both; }
        .home-badge  { animation: fadeUp .8s .1s ease both; }
        .home-btns   { animation: fadeUp .8s .25s ease both; }
        .home-stats  { animation: fadeUp .8s .4s ease both; }
        .home-feat   { animation: fadeUp .8s .55s ease both; }
        .home-cta    { animation: fadeUp .8s .7s ease both; }
        .feat-card:hover { transform: translateY(-6px); border-color: rgba(0,245,196,.28) !important; box-shadow: 0 24px 60px rgba(0,0,0,.5); }
        .feat-card { transition: transform .35s, border-color .35s, box-shadow .35s; }
        .stat-card:hover { border-color: rgba(0,245,196,.3) !important; }
        .stat-card { transition: border-color .25s; }
        .btn-get:hover { transform: scale(1.05); box-shadow: 0 0 32px rgba(0,245,196,.45) !important; }
        .btn-get { transition: transform .25s, box-shadow .25s; }
        .btn-si:hover  { border-color: rgba(0,245,196,.4) !important; color: var(--neon) !important; }
        .btn-si { transition: border-color .25s, color .25s; }
      `}</style>

      <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>
      <div className="aurora"><div className="ab"/><div className="ab"/><div className="ab"/></div>
      <div className="grid-lines"/>

      <div style={{position:"relative",zIndex:1,width:"100%",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"80px 24px 100px",textAlign:"center"}}>

        {/* ── BADGE ──────────────────────────────────── */}
        <div className="home-badge" style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:28,fontSize:"0.75rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--neon)",border:"1px solid rgba(0,245,196,.3)",padding:"6px 18px",borderRadius:100,background:"rgba(0,245,196,.06)"}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:"var(--neon)",animation:"pulse 2s infinite",flexShrink:0}}/>
          Real-time market intelligence
        </div>

        {/* ── HERO HEADLINE ──────────────────────────── */}
        <h1 className="home-hero" style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(2.8rem,7vw,5.5rem)",fontWeight:800,lineHeight:1.05,letterSpacing:"-0.03em",marginBottom:24,maxWidth:900}}>
          Trade smarter with{" "}
          <span style={{background:"linear-gradient(135deg,var(--neon),var(--neon2))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Coinfinex
          </span>
        </h1>

        {/* ── SUBHEADLINE ────────────────────────────── */}
        <p className="home-hero" style={{maxWidth:580,color:"var(--muted)",fontSize:"1.1rem",lineHeight:1.75,marginBottom:44}}>
          The all-in-one virtual trading platform with live market data, portfolio analytics,
          AI-powered news sentiment, and deep stock research — completely free, forever.
        </p>

        {/* ── BUTTONS ────────────────────────────────── */}
        <div className="home-btns" style={{display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center",marginBottom:72}}>
          <Link to="/signup">
            <button className="btn-get" style={{padding:"14px 40px",fontSize:"1rem",fontWeight:700,background:"linear-gradient(135deg,var(--neon),var(--neon2))",color:"#03040a",border:"none",borderRadius:12,cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.3px"}}>
              Get started free →
            </button>
          </Link>
          <Link to="/login">
            <button className="btn-si" style={{padding:"14px 40px",fontSize:"1rem",fontWeight:600,background:"transparent",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,cursor:"pointer",fontFamily:"inherit"}}>
              Sign in
            </button>
          </Link>
        </div>

        {/* ── STATS ROW ──────────────────────────────── */}
        <div className="home-stats" style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",marginBottom:80}}>
          {STATS.map(s=>(
            <div key={s.label} className="stat-card" style={{padding:"16px 28px",borderRadius:14,background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",minWidth:120}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.6rem",fontWeight:800,color:"var(--neon)"}}>{s.value}</div>
              <div style={{fontSize:"0.78rem",color:"var(--muted)",marginTop:4,textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── FEATURES GRID ──────────────────────────── */}
        <div className="home-feat" style={{width:"100%",maxWidth:1100,marginBottom:80}}>
          <div style={{fontSize:"0.72rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--muted)",marginBottom:14}}>Everything you need</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(1.6rem,3vw,2.4rem)",fontWeight:800,marginBottom:48,background:"linear-gradient(135deg,var(--text),var(--muted))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Built for serious traders
          </h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20}}>
            {FEATURES.map(f=>(
              <div key={f.label} className="feat-card" style={{background:"rgba(255,255,255,.025)",border:"1px solid var(--border)",borderRadius:20,padding:"28px 26px",textAlign:"left",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${f.color},transparent)`,opacity:.7}}/>
                <div style={{width:48,height:48,borderRadius:14,background:`${f.color}18`,border:`1px solid ${f.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",marginBottom:18}}>
                  {f.icon}
                </div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.05rem",fontWeight:700,marginBottom:10,color:"var(--text)"}}>{f.label}</div>
                <div style={{fontSize:"0.875rem",color:"var(--muted)",lineHeight:1.7}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS ───────────────────────────── */}
        <div style={{width:"100%",maxWidth:900,marginBottom:80,animation:"fadeUp .8s .65s ease both",opacity:0}}>
          <div style={{fontSize:"0.72rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--muted)",marginBottom:14}}>Simple & fast</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(1.6rem,3vw,2.4rem)",fontWeight:800,marginBottom:48,background:"linear-gradient(135deg,var(--text),var(--muted))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Up and running in seconds
          </h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
            {[
              { step:"01", title:"Create account",   desc:"Sign up free — no credit card, no fees, no commitments." },
              { step:"02", title:"Explore markets",   desc:"Browse 50+ stocks across 7 sectors with live prices." },
              { step:"03", title:"Trade virtually",   desc:"Buy and sell using your simulated balance with real data." },
              { step:"04", title:"Track performance", desc:"Watch your P&L, allocation, and portfolio grow over time." },
            ].map(s=>(
              <div key={s.step} style={{background:"rgba(255,255,255,.025)",border:"1px solid var(--border)",borderRadius:18,padding:"24px 22px",textAlign:"left"}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:"2rem",fontWeight:800,color:"rgba(0,245,196,.2)",marginBottom:14,lineHeight:1}}>{s.step}</div>
                <div style={{fontWeight:700,fontSize:"0.95rem",marginBottom:8}}>{s.title}</div>
                <div style={{fontSize:"0.84rem",color:"var(--muted)",lineHeight:1.65}}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM CTA ─────────────────────────────── */}
        <div className="home-cta" style={{width:"100%",maxWidth:700,background:"linear-gradient(135deg,rgba(0,245,196,.06),rgba(123,97,255,.06))",border:"1px solid rgba(0,245,196,.18)",borderRadius:24,padding:"52px 40px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 20% 50%,rgba(0,245,196,.05),transparent 60%)",pointerEvents:"none"}}/>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(1.6rem,3vw,2.2rem)",fontWeight:800,marginBottom:14,background:"linear-gradient(135deg,var(--text),var(--neon))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Start trading for free today
          </div>
          <p style={{color:"var(--muted)",fontSize:"0.95rem",lineHeight:1.7,marginBottom:32,maxWidth:480,margin:"0 auto 32px"}}>
            Join Coinfinex and experience real stock market conditions — without risking a single rupee.
          </p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <Link to="/signup">
              <button className="btn-get" style={{padding:"14px 40px",fontSize:"1rem",fontWeight:700,background:"linear-gradient(135deg,var(--neon),var(--neon2))",color:"#03040a",border:"none",borderRadius:12,cursor:"pointer",fontFamily:"inherit"}}>
                Create free account
              </button>
            </Link>
            <Link to="/login">
              <button className="btn-si" style={{padding:"14px 32px",fontSize:"1rem",fontWeight:600,background:"transparent",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:12,cursor:"pointer",fontFamily:"inherit"}}>
                Already a member? Sign in
              </button>
            </Link>
          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────── */}
        <div style={{marginTop:64,fontSize:"0.8rem",color:"rgba(240,240,240,.2)",letterSpacing:"0.04em"}}>
          © 2025 Coinfinex · Virtual trading platform · No real money involved
        </div>

      </div>
    </>
  );
}
