import Order from "../models/Order";
import Stock from "../models/userStocksSchema";
import { getCandleData } from "./candleBuilder";

export async function checkAndExecuteOrders() {
  try {
    const pending = await Order.find({ status: "pending" });
    if (!pending.length) return;

    // Get latest price per symbol from candle store
    const symbols   = [...new Set(pending.map((o) => o.stockname))];
    const priceMap: Record<string, number> = {};

    symbols.forEach((sym) => {
      const candles = getCandleData(sym);
      const latest  = candles[candles.length - 1];
      if (latest) priceMap[sym] = latest.c;
    });

    for (const order of pending) {
      const price = priceMap[order.stockname];
      if (!price) continue;

      const hit =
        (order.orderType === "buy"  && price <= order.targetPrice) ||
        (order.orderType === "sell" && price >= order.targetPrice);

      if (!hit) continue;

      try {
        if (order.orderType === "buy") {
          const existing = await Stock.findOne({
            userid: order.userid, stockname: order.stockname,
          });

          if (existing) {
            const totalQty = existing.stockquantity + order.quantity;
            const avgPrice = (
              (existing.stockquantity * existing.stockbuyprice +
                order.quantity * price) / totalQty
            ).toFixed(2);
            existing.stockquantity = totalQty;
            existing.stockbuyprice = parseFloat(avgPrice);
            await existing.save();
          } else {
            await Stock.create({
              userid:        order.userid,
              stockname:     order.stockname,
              stockquantity: order.quantity,
              stockbuyprice: price,
            });
          }

        } else {
          const existing = await Stock.findOne({
            userid: order.userid, stockname: order.stockname,
          });

          if (!existing || existing.stockquantity < order.quantity) {
            await Order.findByIdAndUpdate(order._id, { status: "cancelled" });
            continue;
          }

          existing.stockquantity === order.quantity
            ? await Stock.deleteOne({ userid: order.userid, stockname: order.stockname })
            : (existing.stockquantity -= order.quantity, await existing.save());
        }

        await Order.findByIdAndUpdate(order._id, {
          status:        "executed",
          executedAt:    new Date(),
          executedPrice: price,
        });

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