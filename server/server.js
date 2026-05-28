const dotenv = require("dotenv");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const app = require("./app");
const configureSocket = require("./socket");

dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = process.env.PORT || 5000;

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

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
