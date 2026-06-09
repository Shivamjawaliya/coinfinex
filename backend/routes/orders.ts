import { Router, Request, Response } from "express";
import Order from "../models/Order";
import Stock from "../models/userStocksSchema";
import User from "../models/userModel";
import { auth as authMiddleware } from "../middleware/auth";

const router = Router();

// ── Place limit order ────────────────────────────
router.post("/place-order", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { stockname, orderType, targetPrice, quantity } = req.body;
    const userid = (req as any).user.email;

    if (!stockname || !orderType || !targetPrice || !quantity) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const qty   = parseInt(quantity);
    const price = parseFloat(targetPrice);
    const sym   = (stockname as string).toUpperCase();

    if (orderType === "buy") {
      const user = await User.findOne({ username: userid });
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const cost = price * qty;
      if (user.balance < cost) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Need ₹${cost.toFixed(2)}, available ₹${user.balance.toFixed(2)}`,
        });
      }
    } else if (orderType === "sell") {
      const holding = await Stock.findOne({ userid, stockname: sym });
      if (!holding || holding.stockquantity < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient shares. You have ${holding?.stockquantity ?? 0}, requested ${qty}`,
        });
      }
    }

    const order = await Order.create({
      userid,
      stockname:   sym,
      orderType,
      targetPrice: price,
      quantity:    qty,
    });

    res.json({ success: true, message: `${orderType.toUpperCase()} order placed for ${sym}`, order });

  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Get all orders for user ──────────────────────
router.get("/my-orders", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userid = (req as any).user.email;
    const orders = await Order.find({ userid }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (e: any) {
    res.status(500).json({ success: false, orders: [] });
  }
});

// ── Cancel order ─────────────────────────────────
router.post("/cancel-order/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userid = (req as any).user.email;
    const order  = await Order.findOneAndUpdate(
      { _id: req.params.id, userid, status: "pending" },
      { status: "cancelled" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or already executed" });
    }

    res.json({ success: true, message: "Order cancelled" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Get executed transactions ────────────────────
router.get("/transactions", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userid = (req as any).user.email;
    const orders = await Order.find({ userid, status: "executed" }).sort({ executedAt: -1 });
    res.json({ success: true, transactions: orders });
  } catch (e: any) {
    res.status(500).json({ success: false, transactions: [] });
  }
});

// ── Get pending orders only ──────────────────────
router.get("/pending-orders", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userid = (req as any).user.email;
    const orders = await Order.find({ userid, status: "pending" }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (e: any) {
    res.status(500).json({ success: false, orders: [] });
  }
});

export default router;