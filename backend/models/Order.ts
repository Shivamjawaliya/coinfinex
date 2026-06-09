import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userid:        { type: String, required: true },
  stockname:     { type: String, required: true },
  orderType:     { type: String, enum: ["buy", "sell"], required: true },
  targetPrice:   { type: Number, required: true },
  quantity:      { type: Number, required: true },
  status:        { type: String, enum: ["pending", "executed", "cancelled"], default: "pending" },
  executedAt:    { type: Date },
  executedPrice: { type: Number },
  buyPrice:      { type: Number },
  createdAt:     { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);