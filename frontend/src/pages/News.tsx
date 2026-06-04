import { useEffect, useState } from "react";
import { getNews } from "../services/api";
import Sidebar from "../components/Sidebar";
import type { NewsItem } from "../types";

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchNews = (p: number) => {
    setLoading(true);
    getNews(p)
      .then((res) => {
        setNews(res.data.news);
        setTotalPages(res.data.totalPages);
        setPage(p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNews(1); }, []);

  return (
    <>
      <div className="aurora"><div className="ab" /><div className="ab" /><div className="ab" /></div>
      <div className="grid-lines" />
      <Sidebar active="news" />
      <div className="page-wrap">
        <div className="live-bar">
          <div className="live-dot" /><span className="live-text">Live</span>
          <span>Financial news updated every visit</span>
        </div>
        <div className="topbar">
          <div><h1>Market News</h1><p>Latest financial stories from Yahoo Finance</p></div>
        </div>

        <div className="page-content">
          <div className="page-heading">Latest News</div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : news.length === 0 ? (
            <div style={{ color: "var(--muted)", textAlign: "center", padding: "60px 0" }}>No news available</div>
          ) : (
            <>
              <div className="grid-3" style={{ gap: 20 }}>
                {news.map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer">
                    <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                      {item.thumbnail && (
                        <img
                          src={item.thumbnail}
                          alt=""
                          style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, background: "var(--card)" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: 100, background: "rgba(0,245,196,0.1)", color: "var(--neon)", border: "1px solid rgba(0,245,196,0.2)" }}>
                          {item.source}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{item.published}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.4, flex: 1 }}>{item.title}</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.6 }}>
                        {item.summary.slice(0, 140)}{item.summary.length > 140 ? "…" : ""}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--neon)", fontWeight: 600 }}>Read more →</div>
                    </div>
                  </a>
                ))}
              </div>

              {/* Pagination */}
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 36 }}>
                <button className="btn-outline" onClick={() => fetchNews(page - 1)} disabled={page <= 1} style={{ padding: "8px 20px" }}>
                  ← Prev
                </button>
                <span style={{ padding: "8px 20px", color: "var(--muted)", fontSize: "0.88rem", alignSelf: "center" }}>
                  Page {page} / {totalPages}
                </span>
                <button className="btn-outline" onClick={() => fetchNews(page + 1)} disabled={page >= totalPages} style={{ padding: "8px 20px" }}>
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
