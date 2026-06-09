import { Request, Response } from "express";
import { yahooFinance, yahooNews } from "../utils/helpers";

const CRYPTO = new Set(["BTC","ETH","SOL","BNB","XRP","AVAX","DOGE","ADA","MATIC","DOT","LTC","BCH","LINK","UNI"]);

function resolveSymbol(raw: string): string {
  return CRYPTO.has(raw) ? `${raw}-USD` : raw;
}

// GET /api/stocks/:symbol
export const stockDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const raw = String(req.params.symbol || req.params.id || "").toUpperCase();
    const id  = resolveSymbol(raw);

    const summary = await (yahooFinance as any).quoteSummary(id, {
      modules: ["price", "summaryDetail", "assetProfile", "financialData", "defaultKeyStatistics"],
    });

    const chartData = await (yahooFinance as any).chart(id, {
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

    const history: object[] =
      chartData.quotes?.map((q: any) => ({
        date: q.date,
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume,
      })) || [];

    let news: object[] = [];
    try {
      news = await yahooNews(id);
    } catch (newsErr: any) {
      console.warn("News fetch failed (non-fatal):", newsErr.message);
    }

    res.json({ symbol: id, quote, overview, history, news });
  } catch (err) {
    console.error("Stock route error:", err);
    res.status(500).json({ message: "Failed to load stock data" });
  }
};

// GET /api/stocks/:symbol/price
export const stockPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const raw    = String(req.params.symbol).toUpperCase();
    const symbol = resolveSymbol(raw);
    const quote  = await (yahooFinance as any).quote(symbol);
    const price: number = quote.regularMarketPrice || 0;
    res.json({ success: true, price });
  } catch {
    res.json({ success: false, price: 0 });
  }
};
