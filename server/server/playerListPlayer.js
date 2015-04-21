function PlayerListPlayer(socket,custom){
	this.socket = socket;
	this.custom = custom;
	this.lobbyId = null;
	this.binds = {};
	return this;
}

PlayerListPlayer.prototype.id = function() {
	return this.socket.id;
};

module.exports = PlayerListPlayer;