import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../services/api";
import Sidebar from "../components/Sidebar";
import type { Category } from "../types";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then((res) => {
        setCategories(res.data.categories);
        if (res.data.categories.length > 0) setActive(res.data.categories[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const current = categories.find((c) => c.id === active);

  return (
    <>
      <div className="aurora"><div className="ab" /><div className="ab" /><div className="ab" /></div>
      <div className="grid-lines" />
      <Sidebar active="categories" />
      <div className="page-wrap">
        <div className="live-bar">
          <div className="live-dot" /><span className="live-text">Live</span>
          <span>Browse stocks by sector</span>
        </div>
        <div className="topbar">
          <div><h1>Categories</h1><p>Explore stocks by sector</p></div>
        </div>

        <div className="page-content">
          <div className="page-heading">Market Sectors</div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : (
            <>
              {/* Tab bar */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActive(cat.id)}
                    style={{
                      padding: "8px 18px", borderRadius: 100, fontSize: "0.85rem", fontWeight: 600,
                      background: active === cat.id ? cat.color : "var(--card)",
                      color: active === cat.id ? "#03040a" : "var(--muted)",
                      border: `1px solid ${active === cat.id ? cat.color : "var(--border)"}`,
                      transition: "all 0.2s",
                    }}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>

              {/* Active category */}
              {current && (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: 6 }}>
                      <span style={{ color: current.color }}>{current.emoji}</span> {current.label}
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: "0.88rem" }}>{current.description}</div>
                  </div>

                  <div className="grid-3" style={{ gap: 16 }}>
                    {current.stocks.map((stock) => (
                      <Link to={`/stock/${stock.sym}`} key={stock.sym}>
                        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${current.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", border: `1px solid ${current.color}44` }}>
                              {stock.emoji}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{stock.sym}</div>
                              <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{stock.name}</div>
                            </div>
                          </div>
                          <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{stock.desc}</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <span style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: 100, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>{stock.exchange}</span>
                            <span style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: 100, background: `${current.color}18`, border: `1px solid ${current.color}33`, color: current.color }}>{stock.cap}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
