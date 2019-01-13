'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new (nodeStatic.Server)();
var app = http.createServer(function (req, res) {
	fileServer.serve(req, res);
}).listen(8080);
console.log("Listening on port 8080");

var io = socketIO.listen(app);
io.sockets.on('connection', function (socket) {
	
	socket.on('signaling', function (message) {
		socket.broadcast.emit('signaling', message);
	});

	socket.on('join', function (data) {
		let room = data.room;
		let id = data.id;
		var clientsInRoom = io.sockets.adapter.rooms[room];
		var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
		if (numClients === 0) {
			socket.join(room);
		} else if (numClients === 1) {
			socket.join(room);
			io.sockets.in(room).emit('ready', {room, id});
		}
	});
});
