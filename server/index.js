const app = require("express")();
const http = require("http").createServer(app);
const socketio = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users.js");

const PORT = process.env.PORT || 5000;

const router = require("./router");

socketio.on("connection", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    // if (error) return callback(error);
    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to the room ${user.room}`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name}, has joined!` });
    socket.join(user.room);

    socketio
      .to(user.room)
      .emit("roomData", { room: user.room, users: getUsersInRoom(user.room) });

    // callback(); //?
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    socketio.to(user.room).emit("message", { user: user.name, text: message });
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      socketio
        .to(user.room)
        .emit("message", { user: "admin", text: `${user.name} has left` });
      socketio
        .to(user.room)
        .emit("roomData", {
          room: user.room,
          users: getUsersInRoom(user.room),
        });
    }
  });
});

app.use(router);

http.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});
