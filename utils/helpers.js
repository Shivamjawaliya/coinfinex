const YahooFinance = require("yahoo-finance2").default;

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

// ── Yahoo news helper — handles FailedYahooValidationError gracefully ──
async function yahooNews(query) {
  let raw = null;
  try {
    raw = await yahooFinance.search(query, {}, { validateResult: false });
  } catch (err) {
    // FailedYahooValidationError still carries .result with real data
    if (err.result) {
      raw = err.result;
    } else {
      console.warn("[yahoo news] fetch failed:", err.message);
      return [];
    }
  }

  const feed = raw?.news || [];
  return feed.map((n) => ({
    title: n.title || "No Title",
    url: n.link || "#",
    source: n.publisher || "Yahoo Finance",
    published: n.providerPublishTime
      ? new Date(n.providerPublishTime * 1000).toLocaleString("en-GB")
      : "Unknown Date",
    thumbnail: n.thumbnail?.resolutions?.[0]?.url || "",
    summary: n.summary || "Click to read the full article.",
    sentiment: "Neutral",
  }));
}

module.exports = { yahooFinance, yahooNews };
