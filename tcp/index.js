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

io.on("connection", (socket) => {
  socket.on("attach-server", async (data) => {
    queryService.attach(data).then((result) => {
      console.log(result);
      socket.emit("attach-client", result);
    });
  });
  socket.on("login-server", async (data) => {
    queryService.login(data).then((result) => {
      console.log(result);
      socket.emit("login-client", result);
    });
  });
  socket.on("location", (data) => {
    console.log(data);
  });
});
