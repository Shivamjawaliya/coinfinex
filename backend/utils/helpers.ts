import YahooFinanceLib from "yahoo-finance2";

const yahooFinance = new (YahooFinanceLib as any)({
  suppressNotices: ["yahooSurvey"],
});

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  published: string;
  thumbnail: string;
  summary: string;
  sentiment: string;
}

export async function yahooNews(query: string): Promise<NewsItem[]> {
  let raw: any = null;
  try {
    raw = await yahooFinance.search(query, {}, { validateResult: false });
  } catch (err: any) {
    if (err.result) {
      raw = err.result;
    } else {
      console.warn("[yahoo news] fetch failed:", err.message);
      return [];
    }
  }

  const feed: any[] = raw?.news || [];
  return feed.map((n: any) => ({
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

export { yahooFinance };
