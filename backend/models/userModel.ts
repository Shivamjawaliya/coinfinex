import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  password: string;
  googleid: String;
  avatar: String;
  balance: number;
}

const userSchema = new mongoose.Schema<IUser>({
  name: String,
  username: String,
  password: String,
  googleid: String,
  avatar: String,
  balance: { type: Number, default: 100000 },
});

export default mongoose.model<IUser>("user", userSchema);
