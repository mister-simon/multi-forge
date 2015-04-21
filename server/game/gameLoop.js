// Loop loop loop loop
var Looper = require('./looper');

// Init GameLoop
var GameLoop = (function(){
	function GL(lobbyManager){
		this.lobbyManager = lobbyManager;
		this.loop = new Looper(this.step.bind(this)).play();
	}

	GL.prototype.getLobbies = function() {
		// LobbyManager -> LobbyCollection
		return this.lobbyManager.lobbies.getFlatLobbyList();
	};

	GL.prototype.step = function(){
		var lobbies = this.getLobbies();
		for (var i = 0, l = lobbies.length; i < l; i++) {
			if (!lobbies[i].isPlaying()){ continue; }
			lobbies[i].gameLoopStep();
		}
	};

	return GL;
})();

module.exports = GameLoop;