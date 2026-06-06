import { Router, Request, Response } from "express";
import Order from "../models/Order";
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

    const order = await Order.create({
      userid,
      stockname:   stockname.toUpperCase(),
      orderType,
      targetPrice: parseFloat(targetPrice),
      quantity:    parseInt(quantity),
    });

    res.json({ success: true, message: `${orderType.toUpperCase()} order placed for ${stockname}`, order });

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