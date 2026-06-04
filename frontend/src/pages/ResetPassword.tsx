import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword as apiResetPassword } from "../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [done, setDone]                       = useState(false);

  if (!token || !email) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
        <p style={{ color:"#ff6b6b", fontSize:"1rem" }}>Invalid or missing reset link.</p>
        <Link to="/forgot-password" style={{ color:"#00f5c4" }}>Request a new one →</Link>
      </div>
    );
  }

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setError(""); setLoading(true);
    try {
      await apiResetPassword(token, email, password, confirmPassword);
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Failed to reset password");
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @keyframes drift {
          0%   { transform:translate(0,0); }
          50%  { transform:translate(60px,80px); }
          100% { transform:translate(-40px,30px); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(32px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fl-group { position:relative; margin-bottom:28px; }
        .fl-input {
          width:100%; padding:12px 0; background:transparent;
          border:none; border-bottom:2px solid rgba(240,240,240,0.3);
          color:#f0f0f0; font-family:'DM Sans',sans-serif; font-size:1rem;
          outline:none; box-sizing:border-box; transition:border-color 0.3s;
        }
        .fl-input:focus { border-bottom-color:#00f5c4; }
        .fl-label {
          position:absolute; left:0; top:12px; color:rgba(240,240,240,0.5);
          font-family:'DM Sans',sans-serif; font-size:1rem; pointer-events:none;
          transition:top 0.3s,font-size 0.3s,color 0.3s;
        }
        .fl-input:focus + .fl-label,
        .fl-input:not(:placeholder-shown) + .fl-label { top:-14px; font-size:0.75rem; color:#00f5c4; }
        .rp-btn {
          width:100%; padding:12px; border:none; border-radius:10px;
          background:linear-gradient(135deg,#00f5c4,#7b61ff);
          color:#000; font-family:'DM Sans',sans-serif; font-weight:600;
          font-size:1rem; cursor:pointer; transition:transform 0.3s,box-shadow 0.3s; margin-top:8px;
        }
        .rp-btn:hover:not(:disabled) { transform:scale(1.05); box-shadow:0 0 25px rgba(0,245,196,0.4); }
        .rp-btn:disabled { opacity:0.7; cursor:not-allowed; }
      `}</style>

      {/* Aurora */}
      <div style={{ position:"fixed", inset:0, zIndex:0 }}>
        {[
          { w:500, h:500, bg:"#7b61ff", top:"-100px",   left:"-100px",  delay:"0s"  },
          { w:400, h:400, bg:"#00f5c4", bottom:"-100px", right:"-100px", delay:"-5s" },
          { w:400, h:300, bg:"#ff6b6b", top:"50%",       left:"30%",     delay:"-9s" },
        ].map((b, i) => (
          <div key={i} style={{
            position:"absolute", borderRadius:"50%", filter:"blur(90px)", opacity:0.2,
            width:b.w, height:b.h, background:b.bg,
            top:"top" in b ? b.top : undefined, bottom:"bottom" in b ? b.bottom : undefined,
            left:"left" in b ? b.left : undefined, right:"right" in b ? b.right : undefined,
            animation:`drift 15s ${b.delay} infinite alternate`,
          }}/>
        ))}
      </div>

      <div style={{ position:"relative", zIndex:1, width:"100%", minHeight:"100vh", display:"flex", justifyContent:"center", alignItems:"center" }}>
        <div style={{ width:380, padding:40, borderRadius:20, background:"rgba(255,255,255,0.05)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 0 40px rgba(0,245,196,0.15)", animation:"fadeUp 1s ease" }}>

          {/* Icon */}
          <div style={{ textAlign:"center", marginBottom:16 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:"rgba(0,245,196,0.08)", border:"1px solid rgba(0,245,196,0.2)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:"1.6rem" }}>
              🔑
            </div>
          </div>

          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, textAlign:"center", margin:"0 0 8px", background:"linear-gradient(135deg,#f0f0f0,#00f5c4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Set new password
          </h2>
          <p style={{ textAlign:"center", color:"rgba(240,240,240,0.45)", fontSize:"0.86rem", margin:"0 0 28px" }}>
            For <span style={{ color:"rgba(240,240,240,0.7)", fontWeight:500 }}>{email}</span>
          </p>

          {error && (
            <div style={{ background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.25)", borderRadius:10, padding:"10px 14px", color:"#ff6b6b", fontSize:"0.85rem", marginBottom:20 }}>
              {error}
            </div>
          )}

          {done ? (
            <div style={{ textAlign:"center", animation:"fadeUp 0.4s ease" }}>
              <div style={{ fontSize:"2.5rem", marginBottom:12 }}>✅</div>
              <p style={{ color:"#00f5c4", fontWeight:600, fontSize:"1rem", margin:"0 0 8px" }}>Password updated!</p>
              <p style={{ color:"rgba(240,240,240,0.45)", fontSize:"0.85rem", margin:0 }}>Redirecting to login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="fl-group">
                <input className="fl-input" type="password" value={password} placeholder=" " onChange={e => setPassword(e.target.value)} required minLength={6} />
                <label className="fl-label">New password</label>
              </div>
              <div className="fl-group">
                <input className="fl-input" type="password" value={confirmPassword} placeholder=" " onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
                <label className="fl-label">Confirm new password</label>
              </div>
              <button className="rp-btn" type="submit" disabled={loading}>
                {loading ? "Updating…" : "Update password →"}
              </button>
            </form>
          )}

          {!done && (
            <div style={{ textAlign:"center", marginTop:20, fontSize:"0.88rem", color:"rgba(240,240,240,0.4)" }}>
              <Link to="/login" style={{ color:"#00f5c4", textDecoration:"none", fontWeight:600 }}>← Back to login</Link>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
