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

    socket.on("webrtc:join", (roomId) => {
      if (roomId) {
        socket.join(roomId);
      }
    });

    socket.on("webrtc:leave", (roomId) => {
      if (roomId) {
        socket.leave(roomId);
      }
    });

    socket.on("webrtc:offer", ({ roomId, offer }) => {
      if (roomId && offer) {
        socket.to(roomId).emit("webrtc:offer", { from: socket.user.id, offer });
      }
    });

    socket.on("webrtc:answer", ({ roomId, answer }) => {
      if (roomId && answer) {
        socket.to(roomId).emit("webrtc:answer", { from: socket.user.id, answer });
      }
    });

    socket.on("webrtc:candidate", ({ roomId, candidate }) => {
      if (roomId && candidate) {
        socket.to(roomId).emit("webrtc:candidate", { from: socket.user.id, candidate });
      }
    });
  });
};

module.exports = configureSocket;
