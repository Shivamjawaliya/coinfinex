import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as apiLogin } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      setUser(res.data.user);
      navigate("/explore");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes drift {
          0%   { transform: translate(0, 0); }
          50%  { transform: translate(60px, 80px); }
          100% { transform: translate(-40px, 30px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fl-group {
          position: relative;
          margin-bottom: 28px;
        }
        .fl-input {
          width: 100%;
          padding: 12px 0;
          background: transparent;
          border: none;
          border-bottom: 2px solid rgba(240,240,240,0.3);
          color: #f0f0f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.3s;
        }
        .fl-input:focus {
          border-bottom-color: #00f5c4;
        }
        .fl-label {
          position: absolute;
          left: 0;
          top: 12px;
          color: rgba(240,240,240,0.5);
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          pointer-events: none;
          transition: top 0.3s, font-size 0.3s, color 0.3s;
        }
        .fl-input:focus + .fl-label,
        .fl-input:not(:placeholder-shown) + .fl-label {
          top: -14px;
          font-size: 0.75rem;
          color: #00f5c4;
        }
        .login-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #00f5c4, #7b61ff);
          color: #000;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.3s, box-shadow 0.3s;
          margin-top: 8px;
        }
        .login-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 25px rgba(0,245,196,0.4);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .google-btn {
          width: 100%;
          padding: 11px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.15);
          color: #f0f0f0;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
          margin-top: 12px;
        }
        .google-btn:hover {
          border-color: rgba(0,245,196,0.45);
          background: rgba(0,245,196,0.06);
          box-shadow: 0 0 18px rgba(0,245,196,0.12);
        }
        .or-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 20px 0 4px;
          color: rgba(240,240,240,0.3);
          font-size: 0.78rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .or-divider::before, .or-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.1);
        }
      `}</style>

      {/* Aurora */}
      <div style={{ position:"fixed", inset:0, zIndex:0 }}>
        {[
          { w:500, h:500, bg:"#7b61ff", top:"-100px", left:"-100px", delay:"0s" },
          { w:400, h:400, bg:"#00f5c4", bottom:"-100px", right:"-100px", delay:"-5s" },
          { w:400, h:300, bg:"#ff6b6b", top:"50%",  left:"30%",     delay:"-9s" },
        ].map((b, i) => (
          <div key={i} style={{
            position:"absolute", borderRadius:"50%",
            filter:"blur(90px)", opacity:0.2,
            width:b.w, height:b.h,
            background:b.bg,
            top: "top" in b ? b.top : undefined,
            bottom: "bottom" in b ? b.bottom : undefined,
            left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined,
            animation:`drift 15s ${b.delay} infinite alternate`,
          }}/>
        ))}
      </div>

      {/* Card */}
      <div style={{
        position:"relative", zIndex:1,
        width:"100%", minHeight:"100vh", display:"flex",
        justifyContent:"center", alignItems:"center",
      }}>
        <div style={{
          width:360, padding:40, borderRadius:20,
          background:"rgba(255,255,255,0.05)",
          backdropFilter:"blur(20px)",
          border:"1px solid rgba(255,255,255,0.1)",
          boxShadow:"0 0 40px rgba(0,245,196,0.15)",
          animation:"fadeUp 1s ease",
        }}>

          {/* Title */}
          <h2 style={{
            fontFamily:"'Syne', sans-serif",
            fontSize:"2rem", fontWeight:800,
            textAlign:"center", margin:"0 0 8px 0",
            background:"linear-gradient(135deg,#f0f0f0,#00f5c4)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>Coinfinex</h2>
          <p style={{ textAlign:"center", color:"rgba(240,240,240,0.5)", fontSize:"0.88rem", margin:"0 0 30px 0" }}>
            Sign in to your account
          </p>

          {/* Error */}
          {error && (
            <div style={{ background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.25)", borderRadius:10, padding:"10px 14px", color:"#ff6b6b", fontSize:"0.85rem", marginBottom:20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="fl-group">
              <input
                className="fl-input"
                type="email"
                value={email}
                placeholder=" "
                onChange={e => setEmail(e.target.value)}
                required
              />
              <label className="fl-label">Email address</label>
            </div>

            {/* Password */}
            <div className="fl-group">
              <input
                className="fl-input"
                type="password"
                value={password}
                placeholder=" "
                onChange={e => setPassword(e.target.value)}
                required
              />
              <label className="fl-label">Password</label>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Login"}
            </button>
          </form>

          <div className="or-divider">or</div>

          <button
            className="google-btn"
            type="button"
            onClick={() => { window.location.href = "http://localhost:5001/api/auth/google"; }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.08-6.08C34.46 3.08 29.5 1 24 1 14.82 1 7.07 6.48 3.66 14.26l7.08 5.5C12.43 13.68 17.73 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.68c-.55 2.96-2.2 5.47-4.68 7.15l7.2 5.59C43.18 37.45 46.5 31.44 46.5 24.5z"/>
              <path fill="#FBBC05" d="M10.74 28.24A14.57 14.57 0 0 1 9.5 24c0-1.47.25-2.89.68-4.24l-7.08-5.5A23.93 23.93 0 0 0 0 24c0 3.87.92 7.53 2.54 10.76l8.2-6.52z"/>
              <path fill="#34A853" d="M24 47c6.48 0 11.93-2.15 15.9-5.84l-7.2-5.59C30.6 37.45 27.46 38.5 24 38.5c-6.27 0-11.57-4.18-13.26-9.76l-8.2 6.52C6.07 43.52 14.54 47 24 47z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ textAlign:"center", marginTop:20, fontSize:"0.9rem", color:"rgba(240,240,240,0.5)" }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color:"#00f5c4", textDecoration:"none", fontWeight:600 }}>
              Sign up
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
