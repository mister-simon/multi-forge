var Lobby = require('./lobby');

// Lib
function has(v){ return (typeof v !== 'undefined'); }
function test(v,d){ return has(v)?v:d; }

// Lob
function LobbyCollection(configLobbyTypes, gameStateConfig, io){
	this.configLobbyTypes = configLobbyTypes;
	this.gameStateConfig = gameStateConfig;
	this.lobbyID = 0;
	this.lobbies = {};

	// Create an empty object to contain lobbies
	// for each type of lobby.
	var types = Object.keys(this.configLobbyTypes);
	for (var i = 0, l = types.length; i < l; i++) {
		this.lobbies[types[i]] = {};
	}

	this.io = io;

	return this;
}

LobbyCollection.prototype.getFlatLobbyList = function(){
	var lobbies = [],
		count = 0;

	// Each set of lobbies
	var types = Object.keys(this.configLobbyTypes);
	for (var i = 0, l = types.length; i < l; i++) {
		var lobbyGroup = this.lobbies[types[i]];

		var lobbyIDs = Object.keys(lobbyGroup);
		for (var j = 0, IDsLen = lobbyIDs.length; j < IDsLen; j++) {
			var lobbyID = lobbyIDs[j];
			lobbies[count++] = lobbyGroup[lobbyID];
		}
	}

	return lobbies;
};

// Utils to make it do
LobbyCollection.prototype.createLobby = function(lobbyType) {
	var lobbyConfig = test(this.configLobbyTypes[lobbyType],{}),
		maxLobbies = test(lobbyConfig.maxLobbies,false);


	if(maxLobbies === false || Object.keys(this.lobbies[lobbyType]).length < maxLobbies){
		var id = this.lobbyID++,
			lobby = new Lobby(id, lobbyConfig, this.gameStateConfig, this.io);

		this.lobbies[lobbyType][id] = lobby;
		return this.lobbies[lobbyType][id];
	}

	return null;
};

LobbyCollection.prototype.getAvailableLobby = function(lobbyType) {
	var lobbies = this.lobbies[lobbyType],
		keys = Object.keys(lobbies);

	for (var i = 0, l = keys.length; i < l; i++) {
		if(lobbies[keys[i]].isAvailable()){
			return lobbies[keys[i]];
		}
	}

	return this.createLobby(lobbyType);
};


module.exports = LobbyCollection;
