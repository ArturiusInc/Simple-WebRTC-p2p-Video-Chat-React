const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

const port = 80;

app.use(express.static(path.join(__dirname, "client", "public")));
//app.use(express.static(path.join(__dirname, "client", "build")));
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "index.html"));
	//res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

let userCount = 0;
let usersReady = 0;

io.on("connection", (socket) => {
	userCount = userCount + 1;
	console.log("a user connected", userCount, usersReady);
	io.emit("user count", userCount);

	socket.on("call", () => {
		socket.broadcast.emit("call");
	});

	socket.on("ready", (offer) => {
		usersReady = usersReady + 1;
		console.log("usersReady:", userCount, usersReady);
		if (usersReady === 2) {
			console.log(`Все пользователи (${usersReady}) включили камеры и готовы`);
			io.emit("allReady");
		}
	});

	socket.on("sendOffer", (offer) => {
		socket.broadcast.emit("getOffer", offer);
	});

	socket.on("sendAnswer", (answer) => {
		socket.broadcast.emit("getAnswer", answer);
	});

	socket.on("sendIceCandidate", (candidat) => {
		socket.broadcast.emit("getCandidat", candidat);
	});

	socket.on("disconnect", () => {
		userCount = userCount - 1;
		usersReady = userCount;
		console.log("a user disconnected", userCount, usersReady);
		io.emit("user count", userCount);
	});
});

http.listen(port, () => {
	console.log(`listening on ${port} port`);
});
