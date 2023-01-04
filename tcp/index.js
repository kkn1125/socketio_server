import express from "express";
import { Server } from "socket.io";
import protobufjs from "protobufjs";
import dotenv from "dotenv";
import path from "path";
import queryService from "./src/services/query.service.js";

const mode = process.env.NODE_ENV;
dotenv.config({
  path: path.join(path.resolve(), ".env"),
});
if (mode === "development") {
  dotenv.config({
    path: path.join(path.resolve(), ".env"),
  });
}

const PORT = Number(process.env.PORT);

const app = express();
const server = app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

const { Message, Field } = protobufjs;

Field.d(1, "float", "required")(Message.prototype, "id");
Field.d(2, "float", "required")(Message.prototype, "pox");
Field.d(3, "float", "required")(Message.prototype, "poy");
Field.d(4, "float", "required")(Message.prototype, "poz");
Field.d(5, "float", "required")(Message.prototype, "roy");

// 서버 연결, path는 프론트와 일치시켜준다.
const io = new Server(server, { path: "/socket" });

const users = new Map();

io.on("connection", (socket) => {
  socket.on("attach-server", async (data) => {
    queryService.attach(data).then((result) => {
      // console.log(result);
      users.set(socket.client.id, result);
      const user = users.get(socket.client.id);
      const room = `${user.space.pk}-${user.channel.pk}`;
      socket.join(socket.client.id);
      socket.join(room);
      socket.emit("attach-client", result);
    });
  });
  socket.on("login-server", async (data) => {
    // console.log(data);
    const user = users.get(socket.client.id);
    console.log(user.user.pk);
    const room = `${user.space.pk}-${user.channel.pk}`;
    queryService.login(data).then((result) => {
      io.in(room).to(socket.client.id).emit(room, result);
    });
  });
  socket.on("location-server", (data) => {
    // console.log(data);
    const user = users.get(socket.client.id);
    console.log(user.user.pk);
    const room = `${user.space.pk}-${user.channel.pk}`;
    io.in(room).emit(room, { type: "locations", ...data });
  });
  socket.on("disconnecting", (reason) => {
    console.log("disconnected", socket.client.id);
    if (reason === "transport close" || reason === "transport error") {
      const user = users.get(socket.client.id);
      console.log(user.user.pk);
      const room = `${user.space.pk}-${user.channel.pk}`;
      socket.to(room).emit("logout", user.user.pk);
    }
  });
});
io.on("disconnect", (reason) => {
  console.log("reason", reason);
  if (reason === "io server disconnect") {
    // the disconnection was initiated by the server, you need to reconnect manually
    socket.connect();
  }
});
