import app from "./app";
import { connectDB } from "./config/db";
import { port } from "./config/keys";

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Backend API running on http://localhost:${port}`);
  });
});
