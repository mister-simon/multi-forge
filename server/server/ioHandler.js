function IoHandler(io, playerList){
	this.io = io;
	this.playerList = playerList;

	this.io.on('connection',this.connection.bind(this));

	return this;
}

IoHandler.prototype.connection = function(socket) {
	this.playerList.add(socket);
	socket.on('disconnect',this.disconnection.bind(this,socket));
};


IoHandler.prototype.disconnection = function(socket) {
	this.playerList.rmv(socket);
};

module.exports = IoHandler;