import { Router, Request, Response } from "express";
import Wishlist from "../models/Wishlist";
import { auth } from "../middleware/auth";

const router = Router();

router.get("/my", auth, async (req: Request, res: Response) => {
  try {
    const userid = (req as any).user.email;
    const items = await Wishlist.find({ userid }).sort({ addedAt: -1 });
    res.json({ success: true, wishlist: items.map(i => i.stockname) });
  } catch (e: any) {
    res.status(500).json({ success: false, wishlist: [] });
  }
});

router.post("/add", auth, async (req: Request, res: Response) => {
  try {
    const userid = (req as any).user.email;
    const { stockname } = req.body;
    if (!stockname) return res.status(400).json({ success: false, message: "stockname required" });
    await Wishlist.findOneAndUpdate(
      { userid, stockname: stockname.toUpperCase() },
      { userid, stockname: stockname.toUpperCase(), addedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: "Added to wishlist" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/remove/:symbol", auth, async (req: Request, res: Response) => {
  try {
    const userid = (req as any).user.email;
    await Wishlist.deleteOne({ userid, stockname: String(req.params.symbol).toUpperCase() });
    res.json({ success: true, message: "Removed from wishlist" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
