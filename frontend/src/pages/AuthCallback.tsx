import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [params] = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    if (!code) { navigate("/login"); return; }

    api.get(`/auth/exchange?code=${code}`)
      .then(res => {
        setUser(res.data.user);
        navigate("/explore", { replace: true });
      })
      .catch(() => navigate("/login?error=oauth_failed", { replace: true }));
  }, []);

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, background:"#03040a" }}>
      <div style={{ width:40, height:40, border:"3px solid rgba(0,245,196,0.2)", borderTop:"3px solid #00f5c4", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      <p style={{ color:"rgba(240,240,240,0.5)", fontSize:"0.9rem", fontFamily:"'DM Sans',sans-serif" }}>Signing you in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
