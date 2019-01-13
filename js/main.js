//Create an account on Firebase, and use the credentials they give you in place of the following
let socket = io.connect();

var yourVideo = document.getElementById("yourVideo");
var friendsVideo = document.getElementById("friendsVideo");
var yourId = Math.floor(Math.random() * 10000);
var servers = { 'iceServers': [{ 'urls': 'stun:stun.services.mozilla.com' }, { 'urls': 'stun:stun.l.google.com:19302' }, { 'urls': 'turn:numb.viagenie.ca', 'credential': 'webrtc', 'username': 'websitebeaver@mail.com' }] };
var pc = new RTCPeerConnection(servers);
pc.onicecandidate = (event => event.candidate ? sendMessage(yourId, JSON.stringify({ 'ice': event.candidate })) : console.log("Sent All Ice"));
pc.onaddstream = (event => {
	friendsVideo.srcObject = event.stream;
	document.getElementById("call").style.visibility = 'hidden';
});

function sendMessage(senderId, data) {
	socket.emit('signaling', { sender: senderId, message: data });
}

function readMessage(data) {
	var msg = JSON.parse(data.message);
	var sender = data.sender;
	if (sender != yourId) {
		if (msg.ice != undefined)
			pc.addIceCandidate(new RTCIceCandidate(msg.ice));
		else if (msg.sdp.type == "offer")
			pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
				.then(() => pc.createAnswer())
				.then(answer => pc.setLocalDescription(answer))
				.then(() => sendMessage(yourId, JSON.stringify({ 'sdp': pc.localDescription })));
		else if (msg.sdp.type == "answer")
			pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
	}
};

socket.on('signaling', readMessage);
socket.on('ready', function() {
	document.getElementById("call").disabled = false;
});
	
function showMyFace() {
	navigator.mediaDevices.getUserMedia({ audio: true, video: true })
		.then(stream => yourVideo.srcObject = stream)
		.then(stream => pc.addStream(stream));
}

function showFriendsFace() {
	pc.createOffer()
		.then(offer => pc.setLocalDescription(offer))
		.then(() => sendMessage(yourId, JSON.stringify({ 'sdp': pc.localDescription })));
}

function joinRoom() {
	showMyFace();
	let roomNum = document.getElementById('number').value;
	document.getElementById("room").style.display = "none";
	document.getElementById("screen").style.visibility = "visible";
	socket.emit('join', {room: roomNum, id: yourId});
}
