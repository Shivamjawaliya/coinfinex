const userStocks = require("../models/userStocksSchema");
const { yahooFinance } = require("../utils/helpers");

// =====================================
// BUY STOCK — POST /buy-stock
// =====================================
exports.buyStock = async (req, res) => {
  try {
    const userid = req.user.email;
    const { stockname, stockquantity, stockbuyprice } = req.body;

    const existingStock = await userStocks.findOne({ userid, stockname });

    // IF STOCK ALREADY EXISTS → average up
    if (existingStock) {
      const oldQty = existingStock.stockquantity;
      const oldPrice = existingStock.stockbuyprice;
      const newQty = Number(stockquantity);
      const newPrice = Number(stockbuyprice);
      const totalQty = oldQty + newQty;
      const avgPrice = (
        (oldQty * oldPrice + newQty * newPrice) /
        totalQty
      ).toFixed(2);

      existingStock.stockquantity = totalQty;
      existingStock.stockbuyprice = avgPrice;
      await existingStock.save();

      return res.json({ success: true, message: "Stock Updated Successfully" });
    }

    // CREATE NEW STOCK
    await userStocks.create({ userid, stockname, stockquantity, stockbuyprice });

    res.json({ success: true, message: "Stock Purchased Successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Purchase Failed" });
  }
};

// =====================================
// SELL STOCK — POST /sell-stock
// =====================================
exports.sellStock = async (req, res) => {
  try {
    const userid = req.user.email;
    const { stockname, stockquantity } = req.body;

    const existingStock = await userStocks.findOne({ userid, stockname });

    if (!existingStock) {
      return res.json({ success: false, message: "Stock not found" });
    }

    // Selling more than owned
    if (stockquantity > existingStock.stockquantity) {
      return res.json({
        success: false,
        message: `You have only ${existingStock.stockquantity} shares`,
      });
    }

    // Exact quantity → delete holding
    if (stockquantity == existingStock.stockquantity) {
      await userStocks.deleteOne({ userid, stockname });
      return res.json({ success: true, message: "Stock Sold Successfully" });
    }

    // Reduce quantity
    existingStock.stockquantity -= Number(stockquantity);
    await existingStock.save();

    res.json({ success: true, message: "Stock Sold Successfully" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Something went wrong" });
  }
};

// =====================================
// PORTFOLIO PAGE — GET /Portfolio
// =====================================
exports.portfolio = async (req, res) => {
  try {
    const userid = req.user.email;
    const holdings = await userStocks.find({ userid });

    let portfolio = [];
    let totalPortfolioValue = 0;
    let totalProfit = 0;

    for (const stock of holdings) {
      try {
        const quote = await yahooFinance.quote(stock.stockname);
        const currentPrice = quote.regularMarketPrice || 0;
        const invested = stock.stockbuyprice * stock.stockquantity;
        const currentValue = currentPrice * stock.stockquantity;
        const profit = currentValue - invested;
        const profitPercent =
          invested > 0 ? ((profit / invested) * 100).toFixed(2) : 0;

        totalPortfolioValue += currentValue;
        totalProfit += profit;

        portfolio.push({
          stockname: stock.stockname,
          quantity: stock.stockquantity,
          buyPrice: stock.stockbuyprice,
          currentPrice,
          invested,
          currentValue,
          profit,
          profitPercent,
        });
      } catch (err) {
        console.log("Stock Error:", stock.stockname);
        console.log(err);
      }
    }

    const assetDistribution = portfolio.map((item) => ({
      name: item.stockname,
      value: item.currentValue,
      percent:
        totalPortfolioValue > 0
          ? ((item.currentValue / totalPortfolioValue) * 100).toFixed(1)
          : 0,
    }));

    const recentActivities = holdings.slice().reverse().slice(0, 10);

    const totalProfitPercent =
      totalPortfolioValue > 0
        ? ((totalProfit / totalPortfolioValue) * 100).toFixed(2)
        : 0;

    res.render("Portfolio", {
      user: req.user,
      portfolio,
      totalPortfolioValue,
      totalProfit,
      totalProfitPercent,
      assetDistribution,
      recentActivities,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Virtual trading error");
  }
};

// =====================================
// VIRTUAL TRADING PAGE — GET /virtual-trading
// =====================================
exports.virtualTrading = async (req, res) => {
  try {
    const userid = req.user.email;
    const holdings = await userStocks.find({ userid });

    let portfolio = [];
    let totalPortfolioValue = 0;
    let totalProfit = 0;

    // ✅ FAST — all quotes fire at the same time
    const results = await Promise.allSettled(
      holdings.map((stock) => yahooFinance.quote(stock.stockname))
    );

    for (let i = 0; i < holdings.length; i++) {
      const stock = holdings[i];
      const result = results[i];

      if (result.status === "rejected") {
        console.log(
          "Quote failed for:",
          stock.stockname,
          result.reason?.message
        );
        continue;
      }

      const quote = result.value;
      const currentPrice = quote.regularMarketPrice || 0;
      const invested = stock.stockbuyprice * stock.stockquantity;
      const currentValue = currentPrice * stock.stockquantity;
      const profit = currentValue - invested;
      const profitPercent =
        invested > 0 ? ((profit / invested) * 100).toFixed(2) : 0;

      totalPortfolioValue += currentValue;
      totalProfit += profit;

      portfolio.push({
        stockname: stock.stockname,
        quantity: stock.stockquantity,
        buyPrice: stock.stockbuyprice,
        currentPrice,
        currentValue,
        invested,
        profit,
        profitPercent,
      });
    }

    const assetDistribution = portfolio.map((item) => ({
      name: item.stockname,
      value: item.currentValue,
    }));

    const recentActivities = holdings.slice().reverse().slice(0, 10);

    const totalProfitPercent =
      totalPortfolioValue > 0
        ? ((totalProfit / totalPortfolioValue) * 100).toFixed(2)
        : 0;

    res.render("virtual-trading", {
      user: req.user,
      portfolio,
      totalPortfolioValue,
      totalProfit,
      totalProfitPercent,
      assetDistribution,
      recentActivities,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Virtual Trading Error");
  }
};

// =====================================
// RESET PORTFOLIO — POST /reset-portfolio
// =====================================
exports.resetPortfolio = async (req, res) => {
  try {
    const userid = req.user.email;
    await userStocks.deleteMany({ userid });
    res.json({ success: true, message: "Portfolio Reset Successfully" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Reset Failed" });
  }
};
