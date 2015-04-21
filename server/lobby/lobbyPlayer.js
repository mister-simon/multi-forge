function LobbyPlayer(id, player){
	this.id = id;
	this.player = player;
	this.status = "active";	
	return this;
}

LobbyPlayer.prototype.getClean = function(){
	return {
		id: this.id,
		status: this.status,
		custom: this.player.custom
	};
};

module.exports = LobbyPlayer;