const app = require("./app");
const connectDB = require("./config/db");
const { port } = require("./config/keys");

// Connect to MongoDB (started locally using workspace socket path), then start the HTTP server.
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
});
