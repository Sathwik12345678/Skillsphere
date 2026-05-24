const jwt = require("jsonwebtoken");
const { userRoom } = require("./utils/notifications");

const configureSocket = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Missing auth token"));
      }

      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch {
      return next(new Error("Invalid auth token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.user.id));

    socket.on("conversation:join", (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on("conversation:leave", (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });
  });
};

module.exports = configureSocket;
