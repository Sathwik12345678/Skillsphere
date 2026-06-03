const dotenv = require("dotenv");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const app = require("./app");
const configureSocket = require("./socket");

dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
  await connectDB();

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    },
  });

  configureSocket(io);
  app.set("io", io);

  httpServer.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Stop the other server or set PORT to another value in server/.env.`
      );
      process.exit(1);
    }

    console.error("Server failed to start:", error.message);
    process.exit(1);
  });

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});
