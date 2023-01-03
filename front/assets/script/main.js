import { io } from "socket.io-client";
import protobufjs from "protobufjs";

const { Message, Field } = protobufjs;

Field.d(1, "float", "required")(Message.prototype, "id");
Field.d(2, "float", "required")(Message.prototype, "pox");
Field.d(3, "float", "required")(Message.prototype, "poy");
Field.d(4, "float", "required")(Message.prototype, "poz");
Field.d(5, "float", "required")(Message.prototype, "roy");

/** @type {HTMLCanvasElement} */
const app = document.querySelector("#app");
/** @type {CanvasRenderingContext2D } */
const ctx = app.getContext("2d");
app.width = innerWidth;
app.height = innerHeight;

window.addEventListener("resize", () => {
  app.width = innerWidth;
  app.height = innerHeight;
});

const API_HOST = import.meta.env.VITE_API_HOST;
const API_PORT = import.meta.env.VITE_API_PORT;

// vars
const users = new Map(); // 유저 렌더 리스트
const sockets = new Set(); // 소켓 셋
const userDataMap = {}; // 유저 데이터

// socket
const socket = io(`http://${API_HOST}:${API_PORT}`, {
  path: "/socket",
  transports: ["websocket"],
});
socket.on("connect", (data) => {
  console.log("connect", data);
  socket.emit("attach-server", { locale: navigator.language });
});
socket.on("attach-client", (data) => {
  Object.assign(userDataMap, data);
});
socket.on("login-client", (data) => {
  console.log(data.players)
  Object.assign(userDataMap, data);
});
socket.on("location-client", (data) => {
  users.set(data.id, data);
});
socket.on("player", (data) => {
  console.log(data);
});

// login
function loginModal() {
  const login = document.createElement("div");
  login.id = "logmodal";
  login.innerHTML = `
    <input name="nickname" type="text" />
    <input name="password" type="password" />
    <button>GUEST</button>
    <button id="login">LOGIN</button>
  `;
  document.body.insertAdjacentElement("beforeend", login);
  function loginprocess(e) {
    const target = e.target;
    if (target.id !== "login") return;
    const nickname = document.querySelector('[name="nickname"]').value;
    const password = document.querySelector('[name="password"]').value;
    if (nickname && password) {
      Object.assign(userDataMap.user, {
        nickname,
        password,
      });
      socket.emit("login-server", {
        pk: userDataMap.user.pk,
        nickname: userDataMap.user.nickname,
        password: userDataMap.user.password,
        pox: app.width / 2 - size / 2,
        poy: app.height / 2 - size / 2,
        poz: 0,
        roy: (Math.PI / 180) * 0,
      });
    } else {
      alert("입력칸을 채우세요");
    }
    login.remove();
    window.removeEventListener("click", loginprocess);
  }
  window.addEventListener("click", loginprocess);
}

loginModal();

const direction = {
  w: false,
  s: false,
  a: false,
  d: false,
};
const size = 30;
const speed = 5;

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "w" || key === "s" || key === "a" || key === "d") {
    direction[key] = true;
  }
});

window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (key === "w" || key === "s" || key === "a" || key === "d") {
    direction[key] = false;
  }
});
function clear() {
  ctx.clearRect(0, 0, app.width, app.height);
}
function updateUser() {
  for (let user of users.values()) {
    ctx.fillRect(user.pox, user.poy, size, size);
  }
}
function updateLocation() {
  for (let user of users.values()) {
    if (key === "w" || key === "s" || key === "a" || key === "d") {
      if (user.id === userDataMap.user.pk) {
        if (key === "w") {
          Object.assign(user, {
            pox: user.pox - speed,
          });
        }
        if (key === "s") {
          Object.assign(user, {
            pox: user.pox + speed,
          });
        }
        if (key === "a") {
          Object.assign(user, {
            pox: user.pox - speed,
          });
        }
        if (key === "d") {
          Object.assign(user, {
            pox: user.pox + speed,
          });
        }
      }
    }
  }
}
function render() {
  clear();
  updateUser();
  updateLocation();
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
