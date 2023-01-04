const { io } = require("socket.io-client");

const max = 50;
const start = 0;
const end = max - start;

const sockets = new Map();

// const socket = io(`http://localhost:3000`, {
//   path: "/socket",
//   transports: ["websocket"],
// });
const users = new Map();
const userDataMap = new Map();

// socket.on("connect", (data) => {
//   console.log("connect", data);
// });
// socket.on("attach-client", (data) => {
//   const { players, ...user } = data;
//   Object.assign(userDataMap, user);
//   for (let user of players) {
//     users.set(user.id, Object.assign(users.get(user.id) || {}, user));
//   }
//   // socket.on(`${userDataMap.space.pk}-${userDataMap.channel.pk}`, (data) => {
//   //   console.log("room data", data);
//   //   if (data.type === "login") {
//   //     const { user } = data;
//   //     users.set(user.id, user);
//   //   } else if (data.type === "locations") {
//   //     const { type, ...user } = data;
//   //     users.set(user.id, Object.assign(users.get(user.id), user));
//   //   }
//   // });
// });

setTimeout(() => {
  for (let i = start; i < end; i++) {
    sockets.set(
      i,
      io(`http://localhost:3000`, {
        path: "/socket",
        transports: ["websocket"],
      })
    );
    sockets.get(i).on("connect", (data) => {
      console.log("connect", data);
      sockets.get(i).emit("attach-server", { locale: "ko-kr" });
    });
    sockets.get(i).on("attach-client", (data) => {
      const { players, ...user } = data;
      console.log(user.id);
      userDataMap.set(i, user);
      for (let user of players) {
        users.set(user.id, Object.assign(users.get(user.id) || {}, user));
      }
      // socket.on(`${userDataMap.space.pk}-${userDataMap.channel.pk}`, (data) => {
      //   console.log("room data", data);
      //   if (data.type === "login") {
      //     const { user } = data;
      //     users.set(user.id, user);
      //   } else if (data.type === "locations") {
      //     const { type, ...user } = data;
      //     users.set(user.id, Object.assign(users.get(user.id), user));
      //   }
      // });
    });
  }
  setTimeout(() => {
    for (let q = 0; q < userDataMap.size; q++) {
      console.log("login", q);
      const userData = userDataMap.get(q);
      sockets.get(q).emit("login-server", {
        pk: userData.user.pk,
        nickname: "guest" + q,
        password: q,
        pox: 500 / 2 - 30 / 2,
        poy: 500 / 2 - 30 / 2,
        poz: 0,
        roy: (Math.PI / 180) * 0,
      });
    }
    setTimeout(() => {
      setInterval(async () => {
        for (let w = 0; w < userDataMap.size; w++) {
          const userData = userDataMap.get(w);
          sockets.get(w).emit("location-server", {
            id: userData.user.pk,
            pox: Math.random() * 500,
            poy: Math.random() * 500,
            poz: 0,
            roy: (Math.PI / 180) * 90,
          });
        }
      }, 20);
    }, 5000);
  }, 5000);
}, 1000);

// function loginModal() {
//   const login = document.createElement("div");
//   login.id = "logmodal";
//   login.innerHTML = `
//     <input name="nickname" type="text" />
//     <input name="password" type="password" />
//     <button>GUEST</button>
//     <button id="login">LOGIN</button>
//   `;
//   document.body.insertAdjacentElement("beforeend", login);
//   function loginprocess(e) {
//     const target = e.target;
//     if (target.id !== "login") return;
//     const nickname = document.querySelector('[name="nickname"]').value;
//     const password = document.querySelector('[name="password"]').value;
//     if (nickname && password) {
//       Object.assign(userDataMap, {
//         user: { ...userDataMap.user, nickname, password },
//       });
//       socket.emit("login-server", {
//         pk: userDataMap.user.pk,
//         nickname: userDataMap.user.nickname,
//         password: userDataMap.user.password,
//         pox: app.width / 2 - size / 2,
//         poy: app.height / 2 - size / 2,
//         poz: 0,
//         roy: (Math.PI / 180) * 0,
//       });
//       login.remove();
//       window.removeEventListener("click", loginprocess);
//     } else {
//       alert("입력칸을 채우세요");
//     }
//   }
//   window.addEventListener("click", loginprocess);
// }

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
