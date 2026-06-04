import { Request, Response } from "express";
import { yahooNews, NewsItem } from "../utils/helpers";

// GET /api/news?page=N
export const news = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 9;

    const queries = ["stock market", "finance", "nasdaq"];
    let allNews: NewsItem[] = [];

    for (const q of queries) {
      try {
        const items = await yahooNews(q);
        allNews = allNews.concat(items);
      } catch (e: any) {
        console.warn(`[news] query "${q}" failed:`, e.message);
      }
    }

    const seen = new Set<string>();
    allNews = allNews.filter((n) => {
      if (seen.has(n.url)) return false;
      seen.add(n.url);
      return true;
    });

    const totalPages = Math.max(1, Math.ceil(allNews.length / limit));
    const start = (page - 1) * limit;
    const pageNews = allNews.slice(start, start + limit);

    res.json({ news: pageNews, currentPage: page, totalPages });
  } catch (err) {
    console.error("News route error:", err);
    res.json({ news: [], currentPage: 1, totalPages: 1 });
  }
};
