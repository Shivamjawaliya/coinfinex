import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  password: string;
}

const userSchema = new mongoose.Schema<IUser>({
  name: String,
  username: String,
  password: String,
});

export default mongoose.model<IUser>("user", userSchema);
