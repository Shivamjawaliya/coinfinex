import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
  userid:    { type: String, required: true },
  stockname: { type: String, required: true },
  addedAt:   { type: Date, default: Date.now },
});

wishlistSchema.index({ userid: 1, stockname: 1 }, { unique: true });

export default mongoose.model("Wishlist", wishlistSchema);
