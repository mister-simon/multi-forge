var LobbyCollection = require('./lobbyCollection');
function has(v){ return (typeof v !== 'undefined'); }

function LobbyManager(config, gameStateConfig, io, playerList){
	this.config = config;

	this.playerList = playerList;
	playerList.on('add',this.bindPlayerAPIs.bind(this));

	// Strip out any deactiveated lobby types.
	var types = this.getLobbyTypes();
	for(var i=0, l=types.length; i<l; i++){
		var type = types[i];
		if(has(this.config.lobbies[type].active) && this.config.lobbies[type].active === false){
			delete this.config.lobbies[type];
		}
	}

	this.lobbies = new LobbyCollection(this.config.lobbies, this.optimiseGameConfig(gameStateConfig), io);

	return this;
}

LobbyManager.prototype.getLobbyTypes = function() {
	return Object.keys(this.config.lobbies);
};

LobbyManager.prototype.optimiseGameConfig = function(gameStateConfig) {
	var optimisedConfig = {
		defaults: gameStateConfig.defaults,
		rules: gameStateConfig.rules,
		entityPermissions: {}
	};

	// Spawn
	var entityName = '';

	var spawnHost = gameStateConfig.entityPermissions.host;
	for (var i = 0, l = spawnHost.length; i < l; i++) {
		entityName = spawnHost[i];
		optimisedConfig.entityPermissions[entityName] = 'host';
	}

	var spawnPublic = gameStateConfig.entityPermissions.public;
	for (i = 0, l = spawnPublic.length; i < l; i++) {
		entityName = spawnPublic[i];
		optimisedConfig.entityPermissions[entityName] = 'public';
	}

	/*entityPermissions: {
		bullet: "public",
		asteroid: "host"
	},*/

	return optimisedConfig;
};

LobbyManager.prototype.bindPlayerAPIs = function(player) {
	var socket = player.socket;

	// Track lobby joining for players.
	socket.on('lobby/join', this.addPlayerToLobby.bind(this, player));

	// Send player a list of lobby
	socket.on('lobby/getLobbies', function(player){
		player.socket.emit('response/lobby/getLobbies', 'success', this.getLobbyTypes());
	}.bind(this, player));
};


LobbyManager.prototype.addPlayerToLobby = function(player, lobbyType) {
	// Player is already in a lobby.
	if(player.lobbyId !== null){ return false; }

	// No such thing!
	var lobbyTypes = this.getLobbyTypes();
	if(lobbyTypes.indexOf(lobbyType) === -1){
		player.socket.emit('response/lobby/join', 'error', {msg:'That type of lobby seems not to exist'});
	}

	// Check available lobbies
	var lobby = this.lobbies.getAvailableLobby(lobbyType);

	// Response
	if(lobby === null){
		player.socket.emit('response/lobby/join', 'error', {msg:'Could not find or create a lobby'});
	} else {
		var details = lobby.addPlayer(player);
		player.socket.emit('response/lobby/join', 'success', details);
	}
};

module.exports = LobbyManager;