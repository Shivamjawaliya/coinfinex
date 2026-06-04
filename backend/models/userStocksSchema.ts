import mongoose, { Document } from "mongoose";

export interface IUserStock extends Document {
  userid: string;
  stockname: string;
  stockquantity: number;
  stockbuyprice: number;
}

const userStocksSchema = new mongoose.Schema<IUserStock>({
  userid: { type: String, required: true },
  stockname: { type: String, required: true },
  stockquantity: { type: Number, required: true },
  stockbuyprice: { type: Number, required: true },
});

export default mongoose.model<IUserStock>("userstocks", userStocksSchema);
