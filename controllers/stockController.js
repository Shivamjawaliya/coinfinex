const { yahooFinance, yahooNews } = require("../utils/helpers");

// ─────────────────────────────────────────────────────────────
//  Stock Detail  —  GET /stock/:id
//  Yahoo Finance: quote summary, chart history, news
// ─────────────────────────────────────────────────────────────
exports.stockDetail = async (req, res) => {
  try {
    const id = req.params.id.toUpperCase();
    const userid = req.user.email;

    // ── Stock summary ──────────────────────────────────────
    const summary = await yahooFinance.quoteSummary(id, {
      modules: [
        "price",
        "summaryDetail",
        "assetProfile",
        "financialData",
        "defaultKeyStatistics",
      ],
    });

    // ── Chart data ─────────────────────────────────────────
    const chartData = await yahooFinance.chart(id, {
      period1: new Date("2024-01-01"),
      period2: new Date(),
      interval: "1d",
    });

    const price = summary.price || {};
    const detail = summary.summaryDetail || {};
    const profile = summary.assetProfile || {};
    const financial = summary.financialData || {};
    const stats = summary.defaultKeyStatistics || {};

    const quote = {
      symbol: id,
      open: detail.open || 0,
      high: detail.dayHigh || 0,
      low: detail.dayLow || 0,
      price: price.regularMarketPrice || 0,
      volume: price.regularMarketVolume || 0,
      latestDay: new Date().toISOString().split("T")[0],
      prevClose: detail.previousClose || 0,
      change: (price.regularMarketPrice || 0) - (detail.previousClose || 0),
      changePct: detail.regularMarketChangePercent
        ? detail.regularMarketChangePercent.toFixed(2) + "%"
        : "0%",
    };

    const overview = {
      name: price.longName || id,
      description: profile.longBusinessSummary || "",
      exchange: price.exchangeName || "—",
      currency: price.currency || "USD",
      country: profile.country || "—",
      sector: profile.sector || "—",
      industry: profile.industry || "—",
      marketCap: financial.marketCap || "—",
      pe: detail.trailingPE || "—",
      eps: stats.trailingEps || "—",
      beta: stats.beta || "—",
      week52High: detail.fiftyTwoWeekHigh || "—",
      week52Low: detail.fiftyTwoWeekLow || "—",
      divYield: detail.dividendYield || "—",
      profitMargin: financial.profitMargins || "—",
      revenuePerShare: stats.revenuePerShare || "—",
      analystTarget: financial.targetMeanPrice || "—",
      sharesOutstanding: stats.sharesOutstanding || "—",
    };

    const history =
      chartData.quotes?.map((q) => ({
        date: q.date,
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume,
      })) || [];

    // ── News — Yahoo Finance (isolated, never crashes page) ──
    let news = [];
    try {
      news = await yahooNews(id);
    } catch (newsErr) {
      console.warn("News fetch failed (non-fatal):", newsErr.message);
    }

    res.render("stockinfo", {
      user: req.user,
      data: { symbol: id, quote, overview, history, news, userid },
    });
  } catch (err) {
    console.error("Stock route error:", err);
    res.status(500).send("Something went wrong loading stock data.");
  }
};

// GET /api/yahoo-price/:symbol — live price lookup
exports.yahooPrice = async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const quote = await yahooFinance.quote(symbol);
    const price = quote.regularMarketPrice || 0;
    res.json({ success: true, price });
  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
};
