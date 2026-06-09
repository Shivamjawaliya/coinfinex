import { Request, Response } from "express";
import UserStocks from "../models/userStocksSchema";
import Order from "../models/Order";
import { yahooFinance } from "../utils/helpers";

interface PortfolioItem {
  stockname: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  invested: number;
  currentValue: number;
  profit: number;
  profitPercent: string;
}

async function buildPortfolio(userid: string): Promise<{
  portfolio: PortfolioItem[];
  totalPortfolioValue: number;
  totalProfit: number;
  totalProfitPercent: string;
  assetDistribution: { name: string; value: number; percent?: string }[];
  recentActivities: object[];
}> {
  const holdings = await UserStocks.find({ userid });

  const results = await Promise.allSettled(
    holdings.map((s) => (yahooFinance as any).quote(s.stockname))
  );

  const portfolio: PortfolioItem[] = [];
  let totalPortfolioValue = 0;
  let totalProfit = 0;

  for (let i = 0; i < holdings.length; i++) {
    const stock = holdings[i];
    const result = results[i];
    if (result.status === "rejected") continue;

    const quote = result.value as any;
    const currentPrice: number = quote.regularMarketPrice || 0;
    const invested = stock.stockbuyprice * stock.stockquantity;
    const currentValue = currentPrice * stock.stockquantity;
    const profit = currentValue - invested;
    const profitPercent = invested > 0 ? ((profit / invested) * 100).toFixed(2) : "0";

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
  }

  const totalProfitPercent =
    totalPortfolioValue > 0
      ? ((totalProfit / totalPortfolioValue) * 100).toFixed(2)
      : "0";

  const assetDistribution = portfolio.map((item) => ({
    name: item.stockname,
    value: item.currentValue,
    percent:
      totalPortfolioValue > 0
        ? ((item.currentValue / totalPortfolioValue) * 100).toFixed(1)
        : "0",
  }));

  const recentActivities = holdings.slice().reverse().slice(0, 10);

  return { portfolio, totalPortfolioValue, totalProfit, totalProfitPercent, assetDistribution, recentActivities };
}

// GET /api/portfolio
export const portfolio = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await buildPortfolio(req.user!.email as string);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Portfolio load failed" });
  }
};

// GET /api/trading
export const virtualTrading = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await buildPortfolio(req.user!.email as string);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Virtual trading load failed" });
  }
};

// POST /api/trading/buy
export const buyStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const userid = req.user!.email as string;
    const { stockname, stockquantity, stockbuyprice } = req.body as {
      stockname: string;
      stockquantity: number;
      stockbuyprice: number;
    };

    const existing = await UserStocks.findOne({ userid, stockname });

    if (existing) {
      const oldQty = existing.stockquantity;
      const oldPrice = existing.stockbuyprice;
      const newQty = Number(stockquantity);
      const newPrice = Number(stockbuyprice);
      const totalQty = oldQty + newQty;
      const avgPrice = Number(((oldQty * oldPrice + newQty * newPrice) / totalQty).toFixed(2));

      existing.stockquantity = totalQty;
      existing.stockbuyprice = avgPrice;
      await existing.save();
      await Order.create({ userid, stockname, orderType: "buy", targetPrice: Number(newPrice), quantity: Number(newQty), status: "executed", executedAt: new Date(), executedPrice: Number(newPrice), buyPrice: Number(newPrice) });
      res.json({ success: true, message: "Stock updated successfully" });
      return;
    }

    await UserStocks.create({ userid, stockname, stockquantity, stockbuyprice });
    await Order.create({ userid, stockname, orderType: "buy", targetPrice: Number(stockbuyprice), quantity: Number(stockquantity), status: "executed", executedAt: new Date(), executedPrice: Number(stockbuyprice), buyPrice: Number(stockbuyprice) });
    res.json({ success: true, message: "Stock purchased successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Purchase failed" });
  }
};

// POST /api/trading/sell
export const sellStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const userid = req.user!.email as string;
    const { stockname, stockquantity, stocksellprice } = req.body as { stockname: string; stockquantity: number; stocksellprice?: number };

    const existing = await UserStocks.findOne({ userid, stockname });
    if (!existing) {
      res.json({ success: false, message: "Stock not found" });
      return;
    }

    if (stockquantity > existing.stockquantity) {
      res.json({ success: false, message: `You only have ${existing.stockquantity} shares` });
      return;
    }

    const buyPrice  = existing.stockbuyprice;
    const sellPrice = stocksellprice ?? buyPrice;

    if (Number(stockquantity) === existing.stockquantity) {
      await UserStocks.deleteOne({ userid, stockname });
      await Order.create({ userid, stockname, orderType: "sell", targetPrice: buyPrice, quantity: Number(stockquantity), status: "executed", executedAt: new Date(), executedPrice: sellPrice, buyPrice });
      res.json({ success: true, message: "Stock sold successfully" });
      return;
    }

    existing.stockquantity -= Number(stockquantity);
    await existing.save();
    await Order.create({ userid, stockname, orderType: "sell", targetPrice: buyPrice, quantity: Number(stockquantity), status: "executed", executedAt: new Date(), executedPrice: sellPrice, buyPrice });
    res.json({ success: true, message: "Stock sold successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Something went wrong" });
  }
};

// POST /api/trading/reset
export const resetPortfolio = async (req: Request, res: Response): Promise<void> => {
  try {
    const userid = req.user!.email as string;
    await UserStocks.deleteMany({ userid });
    res.json({ success: true, message: "Portfolio reset successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Reset failed" });
  }
};
