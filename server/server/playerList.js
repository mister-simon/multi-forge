var Player = require('./playerListPlayer'),
	events = require('events'),
	copy = require('deepcopy');

function PlayerList(initialConfig){
	events.EventEmitter.call(this);

	this.initialConfig = initialConfig;
	this.players = {};
	return this;
}

PlayerList.prototype = events.EventEmitter.prototype;

PlayerList.prototype.add = function(socket) {
	var player = new Player(socket, copy(this.initialConfig.custom));
	this.players[socket.id] = player;
	this.emit('add', this.players[socket.id]);
};

PlayerList.prototype.rmv = function(socket) {
	this.emit('rmv', this.players[socket.id]);
	delete this.players[socket.id];
};

module.exports = PlayerList;