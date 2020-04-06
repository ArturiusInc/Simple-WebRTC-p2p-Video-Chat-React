import React from "react";

export default function View(props) {
	const { call, usersCount, localVideo, remoteVideo, width, height, handlerCall } = props.prop;
	return !call ? (
		<>
			<div className="users">
				<h1>Users online:</h1>
				<div className="users-online">
					{[...Array(usersCount)].map(() => (
						<div className="user"></div>
					))}
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
			<video ref={localVideo} autoPlay muted width={width} height={height} />
			<video ref={remoteVideo} autoPlay controls width={width} height={height} />
		</>
	);
}
