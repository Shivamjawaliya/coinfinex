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
