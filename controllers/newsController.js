const { yahooNews } = require("../utils/helpers");

// =====================================
// UNIVERSAL STOCK NEWS — GET /news (paginated)
// =====================================
exports.news = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;

    // Fetch news for broad market topics — try multiple queries, merge results
    const queries = ["stock market", "finance", "nasdaq"];
    let allNews = [];

    for (const q of queries) {
      try {
        const items = await yahooNews(q);
        allNews = allNews.concat(items);
      } catch (e) {
        console.warn(`[news] query "${q}" failed:`, e.message);
      }
    }

    // Deduplicate by URL
    const seen = new Set();
    allNews = allNews.filter((n) => {
      if (seen.has(n.url)) return false;
      seen.add(n.url);
      return true;
    });

    const totalPages = Math.max(1, Math.ceil(allNews.length / limit));
    const start = (page - 1) * limit;
    const news = allNews.slice(start, start + limit);

    res.render("news", { user: req.user, news, currentPage: page, totalPages });
  } catch (err) {
    console.error("News route error:", err);
    res.render("news", {
      user: req.user,
      news: [],
      currentPage: 1,
      totalPages: 1,
    });
  }
};
