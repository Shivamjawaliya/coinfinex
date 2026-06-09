import Order from "../models/Order";
import Stock from "../models/userStocksSchema";
import User from "../models/userModel";
import { getCandleData } from "./candleBuilder";
import { yahooFinance } from "./helpers";

// Called on every live Finnhub tick for a specific symbol — zero polling delay
export async function checkOrdersForSymbol(symbol: string, price: number) {
  try {
    const pending = await Order.find({ status: "pending", stockname: symbol });
    if (!pending.length) return;

    for (const order of pending) {
      const hit =
        (order.orderType === "buy"  && price <= order.targetPrice) ||
        (order.orderType === "sell" && price >= order.targetPrice);

      if (!hit) continue;

      try {
        const user = await User.findOne({ username: order.userid });
        if (!user) { await Order.findByIdAndUpdate(order._id, { status: "cancelled" }); continue; }

        if (order.orderType === "buy") {
          const cost = price * order.quantity;
          if (user.balance < cost) {
            await Order.findByIdAndUpdate(order._id, { status: "cancelled" });
            console.warn(`❌ Cancelled BUY ${symbol} — insufficient balance [${order.userid}]`);
            continue;
          }
          const existing = await Stock.findOne({ userid: order.userid, stockname: symbol });
          if (existing) {
            const totalQty = existing.stockquantity + order.quantity;
            existing.stockbuyprice = parseFloat(
              ((existing.stockquantity * existing.stockbuyprice + order.quantity * price) / totalQty).toFixed(2)
            );
            existing.stockquantity = totalQty;
            await existing.save();
          } else {
            await Stock.create({ userid: order.userid, stockname: symbol, stockquantity: order.quantity, stockbuyprice: price });
          }
          user.balance = parseFloat((user.balance - cost).toFixed(2));
          await user.save();
          await Order.findByIdAndUpdate(order._id, { status: "executed", executedAt: new Date(), executedPrice: price, buyPrice: price });

        } else {
          const existing = await Stock.findOne({ userid: order.userid, stockname: symbol });
          if (!existing || existing.stockquantity < order.quantity) {
            await Order.findByIdAndUpdate(order._id, { status: "cancelled" });
            console.warn(`❌ Cancelled SELL ${symbol} — insufficient shares [${order.userid}]`);
            continue;
          }
          const originalBuyPrice = existing.stockbuyprice;
          existing.stockquantity === order.quantity
            ? await Stock.deleteOne({ userid: order.userid, stockname: symbol })
            : (existing.stockquantity -= order.quantity, await existing.save());
          user.balance = parseFloat((user.balance + price * order.quantity).toFixed(2));
          await user.save();
          await Order.findByIdAndUpdate(order._id, { status: "executed", executedAt: new Date(), executedPrice: price, buyPrice: originalBuyPrice });
        }

        console.log(`✅ Executed: ${order.orderType.toUpperCase()} ${order.quantity} ${symbol} @ $${price} [${order.userid}]`);

      } catch (e: any) {
        console.error(`Order ${order._id} failed:`, e.message);
      }
    }
  } catch (e: any) {
    console.error(`checkOrdersForSymbol(${symbol}) error:`, e.message);
  }
}

async function getLivePrice(symbol: string): Promise<number | null> {
  // Try in-memory candle store first (zero latency)
  const candles = getCandleData(symbol);
  const latest  = candles[candles.length - 1];
  if (latest) return latest.c;

  // Fallback to Yahoo Finance when candle store is empty (e.g. after restart)
  try {
    const quote = await (yahooFinance as any).quote(symbol);
    return quote?.regularMarketPrice ?? null;
  } catch {
    return null;
  }
}

export async function checkAndExecuteOrders() {
  try {
    const pending = await Order.find({ status: "pending" });
    if (!pending.length) return;

    const symbols = [...new Set(pending.map((o) => o.stockname))];
    const priceMap: Record<string, number> = {};

    await Promise.all(
      symbols.map(async (sym) => {
        const price = await getLivePrice(sym);
        if (price) priceMap[sym] = price;
      })
    );

    for (const order of pending) {
      const price = priceMap[order.stockname];
      if (!price) continue;

      const hit =
        (order.orderType === "buy"  && price <= order.targetPrice) ||
        (order.orderType === "sell" && price >= order.targetPrice);

      if (!hit) continue;

      try {
        const user = await User.findOne({ username: order.userid });
        if (!user) {
          await Order.findByIdAndUpdate(order._id, { status: "cancelled" });
          continue;
        }

        if (order.orderType === "buy") {
          const cost = price * order.quantity;

          if (user.balance < cost) {
            await Order.findByIdAndUpdate(order._id, { status: "cancelled" });
            console.warn(`❌ Cancelled BUY ${order.stockname} — insufficient balance [${order.userid}]`);
            continue;
          }

          const existing = await Stock.findOne({ userid: order.userid, stockname: order.stockname });

          if (existing) {
            const totalQty = existing.stockquantity + order.quantity;
            const avgPrice = parseFloat(
              ((existing.stockquantity * existing.stockbuyprice + order.quantity * price) / totalQty).toFixed(2)
            );
            existing.stockquantity = totalQty;
            existing.stockbuyprice = avgPrice;
            await existing.save();
          } else {
            await Stock.create({
              userid:        order.userid,
              stockname:     order.stockname,
              stockquantity: order.quantity,
              stockbuyprice: price,
            });
          }

          user.balance = parseFloat((user.balance - cost).toFixed(2));
          await user.save();
          await Order.findByIdAndUpdate(order._id, { status: "executed", executedAt: new Date(), executedPrice: price, buyPrice: price });

        } else {
          const existing = await Stock.findOne({ userid: order.userid, stockname: order.stockname });

          if (!existing || existing.stockquantity < order.quantity) {
            await Order.findByIdAndUpdate(order._id, { status: "cancelled" });
            console.warn(`❌ Cancelled SELL ${order.stockname} — insufficient shares [${order.userid}]`);
            continue;
          }

          const originalBuyPrice = existing.stockbuyprice;

          if (existing.stockquantity === order.quantity) {
            await Stock.deleteOne({ userid: order.userid, stockname: order.stockname });
          } else {
            existing.stockquantity -= order.quantity;
            await existing.save();
          }

          const proceeds = parseFloat((price * order.quantity).toFixed(2));
          user.balance   = parseFloat((user.balance + proceeds).toFixed(2));
          await user.save();
          await Order.findByIdAndUpdate(order._id, { status: "executed", executedAt: new Date(), executedPrice: price, buyPrice: originalBuyPrice });
        }

        console.log(
          `✅ Executed: ${order.orderType.toUpperCase()} ` +
          `${order.quantity} ${order.stockname} @ $${price} ` +
          `[${order.userid}]`
        );

      } catch (e: any) {
        console.error(`Order ${order._id} failed:`, e.message);
      }
    }
  } catch (e: any) {
    console.error("checkAndExecuteOrders error:", e.message);
  }
}