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
  const { players, ...user } = data;
  console.log(data);
  Object.assign(userDataMap, user);
  for (let user of players) {
    users.set(user.id, Object.assign(users.get(user.id) || {}, user));
  }
  socket.on(`${userDataMap.space.pk}-${userDataMap.channel.pk}`, (data) => {
    // console.log("room data", data);
    if (data.type === "login") {
      const { user } = data;
      users.set(user.id, user);
    } else if (data.type === "locations") {
      const { type, ...user } = data;
      users.set(user.id, Object.assign(users.get(user.id) || {}, user));
    }
  });
});
socket.on("logout", (data) => {
  console.log("logout", data);
  users.delete(data);
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
      Object.assign(userDataMap, {
        user: { ...userDataMap.user, nickname, password },
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
      login.remove();
      window.removeEventListener("click", loginprocess);
    } else {
      alert("입력칸을 채우세요");
    }
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
    ctx.textAlign = "center";
    ctx.fillText(user.nickname, user.pox + size / 2, user.poy - 10);
  }
}
function userMove() {
  for (let user of users.values()) {
    if (direction["w"] || direction["s"] || direction["a"] || direction["d"]) {
      if (user.id === userDataMap.user.pk) {
        if (direction["w"]) {
          Object.assign(user, {
            poy: user.poy - speed,
          });
        }
        if (direction["s"]) {
          Object.assign(user, {
            poy: user.poy + speed,
          });
        }
        if (direction["a"]) {
          Object.assign(user, {
            pox: user.pox - speed,
          });
        }
        if (direction["d"]) {
          Object.assign(user, {
            pox: user.pox + speed,
          });
        }
        updateLocation(user);
      }
    }
  }
}
function updateLocation(user) {
  socket.emit("location-server", {
    id: user.id,
    pox: user.pox,
    poy: user.poy,
    poz: user.poz,
    roy: user.roy,
  });
}
function render() {
  clear();
  updateUser();
  userMove();
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
