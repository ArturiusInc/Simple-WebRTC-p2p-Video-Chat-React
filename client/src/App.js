import React, { useRef, useState, useEffect } from "react";
import io from "socket.io-client";
export const socket = io.connect();

let pc = null;

function App() {
	const localVideo = useRef();
	const remoteVideo = useRef();
	const [call, setcall] = useState(false);
	const [offerer, setOfferer] = useState(false);
	const [usersCount, setusersCount] = useState(1);
	const peerConfig = { iceServers: [{ urls: ["stun:stun4.l.google.com:19302"] }] };
	const [localStream, setLocalStream] = useState();
	const [width, setwidth] = useState(320);
	const [height, setheight] = useState(240);

	function videoSize() {
		const browserWidth = document.documentElement.clientWidth;
		const browserHeight = document.documentElement.clientHeight;
		const ratio = browserWidth / browserHeight;
		if (ratio <= 1.5) {
			console.log("ratio:", ratio);
			const height = Math.floor(browserHeight / 2);
			const width = Math.floor((height / 3) * 4);
			setheight(height);
			setwidth(width);
		}
	}

	useEffect(() => {
		socket.on("user count", (count) => setusersCount(count));
	}, [setusersCount]);

	const handlerCall = () => {
		setcall(true);
		socket.emit("call");
	};

	useEffect(() => {
		if (call) {
			const streamOptions = { audio: true, video: true };
			navigator.mediaDevices
				.getUserMedia(streamOptions)
				.then((stream) => {
					setLocalStream(stream);
					localVideo.current.srcObject = stream;
				})
				.catch((e) => console.log("Доступ к камере запрещён", e));
			videoSize();
		}
	}, [call]);

	useEffect(() => {
		socket.on("call", () => {
			setcall(true);
			setOfferer(true);
			console.log("Мне позвонили");
		});
	}, []);

	useEffect(() => {
		if (localStream) {
			socket.emit("ready");
		}
	}, [localStream]);

	useEffect(() => {
		if (localStream) {
			socket.on("allReady", () => {
				if (offerer) {
					pc = new RTCPeerConnection(peerConfig);
					localStream.getTracks().forEach((track) => {
						pc.addTrack(track, localStream);
					});
					pc.onnegotiationneeded = () => {
						pc.createOffer({ iceRestart: false, voiceActivityDetection: true })
							.then((offer) => pc.setLocalDescription(offer))
							.then(() => {
								console.debug("установил и отправил LocalDescription:", pc.localDescription);
								socket.emit("sendOffer", pc.localDescription);
							})
							.catch((e) => console.error(e));
					};
					pc.onicecandidate = (e) => {
						if (e.candidate) socket.emit("sendIceCandidate", e.candidate);
					};
					pc.ontrack = (e) => {
						if (e.track.kind === "video") remoteVideo.current.srcObject = e.streams[0];
					};
				}
			});
		}
	}, [offerer, localStream, peerConfig]);

	useEffect(() => {
		if (localStream) {
			socket.on("getOffer", (remoteOffer) => {
				console.log("принял оффер");
				pc = new RTCPeerConnection(peerConfig);
				localStream.getTracks().forEach((track) => {
					pc.addTrack(track, localStream);
				});
				pc.onnegotiationneeded = () => {
					pc.setRemoteDescription(remoteOffer)
						.then(() => {
							console.debug("удалось применить RemoteDescription ответ ", remoteOffer);
							pc.createAnswer()
								.then((answer) => pc.setLocalDescription(answer))
								.then(() => {
									console.debug("установил LocalDescription:", pc.localDescription);
									socket.emit("sendAnswer", pc.localDescription);
								})
								.catch((e) => {
									console.error("не удалось установить локальный дескриптор", e);
								});
						})
						.catch((e) => {
							console.error("не удалось установить удалённый дескриптор", e);
						});
				};
				pc.onicecandidate = (e) => {
					console.log("кандидат");
					if (e.candidate) socket.emit("sendIceCandidate", e.candidate);
				};
				pc.ontrack = (e) => {
					if (e.track.kind === "video") remoteVideo.current.srcObject = e.streams[0];
				};
			});
		}
	}, [localStream, peerConfig]);

	useEffect(() => {
		socket.on("getAnswer", (answer) => {
			pc.setRemoteDescription(answer)
				.then(() => {
					console.debug("удалось применить RemoteDescription ответ ", answer);
				})
				.catch((e) => {
					console.error("не удалось применить  RemoteDescription ", answer, e);
				});
		});
	}, []);

	useEffect(() => {
		socket.on("getCandidat", (candidat) => {
			if (pc.localDescription) {
				pc.addIceCandidate(candidat)
					.then(() => console.log("кандидат применён"))
					.catch((e) => {
						console.error("Failure during addIceCandidate(): " + e);
					});
			}
		});
	}, []);

	return (
		<div className="App">
			{!call ? (
				<>
					<div className="users">
						<h1>Users:</h1>
						<div className="users-online">
							{usersCount === 1 ? (
								<div className="user"></div>
							) : (
								<>
									<div className="user"></div>
									<div className="user"></div>
								</>
							)}
						</div>
					</div>
					{usersCount === 2 && (
						<button className="call" onClick={() => handlerCall()}>
							Позвонить
						</button>
					)}
				</>
			) : (
				<>
					<video ref={localVideo} autoPlay controls muted width={width} height={height}></video>
					<video ref={remoteVideo} autoPlay controls width={width} height={height}></video>
				</>
			)}
		</div>
	);
}

export default App;
