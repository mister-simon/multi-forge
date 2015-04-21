// -----------------
// Init
// -----------------

var LobbyPlayer = require('./lobbyPlayer'),
 	GameState = require('../game/gameState'),
	events = require('events');

// Lib
function has(v){ return (typeof v !== 'undefined'); }

// Lob
function Lobby(id, config, gameStateConfig, io){
	events.EventEmitter.call(this);

	this.lobbyId = id;
	this.config = config;
	this.io = io;
	if(!has(this.io)){ this.io = false; }

	this.host = null;

	this.gameState = new GameState(gameStateConfig, this.getPlayerList, this);

	// Todo: create lobbyPlayerCollection
	this.playerIDs = 0;
	this.players = {};

	this.playerAPIListeners = {
		'disconnect':this.disconnect,
		'lobby/leave':this.leave,

		'game/prepare':this.prepare,
		'game/start':this.start,
		'game/stop':this.stop,
		'game/reset':this.reset,

		'game/createEntity':this.createEntity,
		'game/destroyEntity':this.destroyEntity,
		'game/update':this.update
	};
}
Lobby.prototype = events.EventEmitter.prototype;



// -----------------
// APIS
// -----------------

// ===== API utils
// ----- Player binds
Lobby.prototype.bindLobbyAPIs = function(player){
	var keys = Object.keys(this.playerAPIListeners);
	
	for (var i = 0, l = keys.length; i < l; i++) {
		var route = keys[i],
			responseRoute = 'response/'+route,
			func = this.playerAPIListeners[route].bind(this,responseRoute,player);

		player.binds[route] = func;
		player.socket.on(route,player.binds[route]);
	}
};

Lobby.prototype.unbindLobbyAPIs = function(player){
	var keys = Object.keys(this.playerAPIListeners);
	
	for (var i = 0, l = keys.length; i < l; i++) {
		var route = keys[i];
		player.socket.removeListener(route, player.binds[route]);
		player.binds[route] = null;
	}
};

// ----- Rooms
Lobby.prototype.getRoomName = function() {
	return ("Lobby-"+this.lobbyId);
};

Lobby.prototype.toLobby = function(event, data) {
	if(this.io !== false){ this.io.to(this.getRoomName()).emit(event, data); }
};

// ----- Filters
Lobby.prototype.isPlayerHost = function(lobbyPlayer, responseRoute) {
	if(lobbyPlayer.isHost === false){
		lobbyPlayer.player.socket.emit(responseRoute,'error',{ msg: 'Must be Lobby Host'});
		return false;
	}
	return true;
};

Lobby.prototype.isGameState = function(state, player, responseRoute) {
	if(this.gameState.getState() !== state){
		player.socket.emit(responseRoute,'error',{ msg: 'Lobby\'s Game State must be "'+state+'"'});
		return false;
	}
	return true;
};

// ----- Helpers
Lobby.prototype.emitGameState = function() {
	this.toLobby('update/game/state',this.gameState.getState());
};
Lobby.prototype.emitGameUpdate = function(data) {
	this.toLobby('update/game',data);
};


// ===== Bindable APIs	
// ----- PUBLIC
Lobby.prototype.disconnect = function(responseRoute, player){
	console.log('Lobby',this.lobbyId,'- disconnect');
	this.rmvPlayer(player);
};

Lobby.prototype.leave = function(responseRoute, player){
	console.log('Lobby',this.lobbyId,'- leave');
	this.rmvPlayer(player);
	player.socket.emit(responseRoute,'success');
};

Lobby.prototype.createEntity = function(responseRoute, player, data){
	var lobbyPlayer = this.getLobbyPlayer(player),
		create = this.gameState.createEntity(lobbyPlayer, data);

	if(create === true){
		player.socket.emit(responseRoute,'success');
	} else {
		player.socket.emit(responseRoute,'error', create);
	}
};

Lobby.prototype.destroyEntity = function(responseRoute, player, data){
	var lobbyPlayer = this.getLobbyPlayer(player),
		destroy = this.gameState.destroyEntity(lobbyPlayer, data);

	if(destroy === true){
		player.socket.emit(responseRoute,'success');
	} else {
		player.socket.emit(responseRoute,'error', destroy);
	}
};


var updateCounter = 0;
Lobby.prototype.update = function(responseRoute, player, data){
	var lobbyPlayer = this.getLobbyPlayer(player);

	if(updateCounter++ > 1000){
		console.log('Lobby',this.lobbyId,'- updated 1000 times');
		updateCounter = 0;
	}
	this.gameState.update(lobbyPlayer, data);
};

// ----- HOST ONLY
Lobby.prototype.reset = function(responseRoute, player){
	if(!this.isGameState("stopped", player, responseRoute)){ return; }

	var lobbyPlayer = this.getLobbyPlayer(player);
	if(!this.isPlayerHost(lobbyPlayer,responseRoute)){ return; }

	// Success!
	console.log('Lobby',this.lobbyId,'- reset');
	this.resetLobby();

	player.socket.emit(responseRoute,'success', this.getCleanLobbyDetails());
	this.emitGameState();
};

Lobby.prototype.prepare = function(responseRoute, player){
	if(!this.isGameState("lobby", player, responseRoute)){ return; }

	var lobbyPlayer = this.getLobbyPlayer(player);
	if(!this.isPlayerHost(lobbyPlayer,responseRoute)){ return; }

	// minPlayersToStartGame must be getActivePlayerCount
	if(this.hasEnoughPlayersToStart() === false){
		// Not enough
		var minPlayers = this.config.minPlayersToStartGame;
		player.socket.emit(responseRoute,'error',{ msg: 'Must have '+minPlayers+' Players to Prepare/Start'});
		return;
	}

	// Success!
	console.log('Lobby',this.lobbyId,'- prepare');
	this.gameState.prepare();

	player.socket.emit(responseRoute, 'success', this.getCleanLobbyDetails());
	this.emitGameState();
};

Lobby.prototype.start = function(responseRoute, player){
	if(!this.isGameState("preparing", player, responseRoute)){ return; }

	var lobbyPlayer = this.getLobbyPlayer(player);
	if(!this.isPlayerHost(lobbyPlayer,responseRoute)){ return; }

	// Success
	console.log('Lobby',this.lobbyId,'- start');
	this.gameState.start();

	player.socket.emit(responseRoute,'success', this.getCleanLobbyDetails());
	this.emitGameState();
};

Lobby.prototype.stop = function(responseRoute, player){
	if(!this.isGameState("playing", player, responseRoute)){ return; }

	var lobbyPlayer = this.getLobbyPlayer(player);
	if(!this.isPlayerHost(lobbyPlayer,responseRoute)){ return; }

	// Success!
	console.log('Lobby',this.lobbyId,'- stop');
	this.gameState.stop();

	player.socket.emit(responseRoute,'success', this.getCleanLobbyDetails());
	this.emitGameState();
};



// -----------------
// Game Loop Ticks!
// -----------------
Lobby.prototype.gameLoopStep = function(){
	var data = this.gameState.step();
	this.emitGameUpdate(data);
};



// -----------------
// Clean lobby information
// -----------------
Lobby.prototype.getPlayerList = function(){
	var players = {},
		keys = Object.keys(this.players);

	for (var i = 0; i < keys.length; i++) {
		var player = this.players[keys[i]];
		players[player.id] = player.getClean();
		players[player.id].isHost = (this.host !== null && player.id === this.host);
	}

	return players;
};

Lobby.prototype.getCleanLobbyDetails = function(){
	return {
		host: this.host,
		gameState: this.gameState.getClean(),
		players: this.getPlayerList(),
		minPlayers: this.config.minPlayersToStartGame
	};
};



// -----------------
// Player type methods
// -----------------
Lobby.prototype.emitPlayerList = function() {
	var list = this.getPlayerList();
	this.emit('playerListUpdate',list);
	this.toLobby('update/lobby/players',list);
};

Lobby.prototype.addPlayer = function(player){
	console.log('Lobby',this.lobbyId,'- join');

	var id = this.playerIDs++,
		newPlayer = new LobbyPlayer(id,player);

	player.lobbyId = this.lobbyId;
	this.players[player.id()] = newPlayer;

	// Should this person be the host?
	if(this.host === null){
		this.host = newPlayer.id;
	}

	// NOTIFY PLAYERS + GAME STATE
	this.emitPlayerList();

	// Players are included in all lobby events
	player.socket.join(this.getRoomName());
	this.bindLobbyAPIs(player);

	// Response to the player, tell them who they are
	var details = this.getCleanLobbyDetails();
	details.yourId = newPlayer.id;

	return details;
};

Lobby.prototype.rmvPlayer = function(player){
	// Unbind player from the lobby's APIs
	player.socket.leave(this.getRoomName());
	this.unbindLobbyAPIs(player);

	// Mark player as inactive + no longer in cur lobby
	var lobbyPlayer = this.getLobbyPlayer(player);
	player.lobbyId = null;
	lobbyPlayer.status = "inactive";

	// Update host if the host left
	if(lobbyPlayer.id === this.host){
		this.host = null;
		this.selectHost();
	}

	// If no players are left reset the lobby
	if(this.getActivePlayerCount() === 0){
		this.playerIDs = 0;
		this.resetLobby();
	} else {
		// Cull inactives when not playing
		if(this.gameState.getState() === "lobby"){
			this.cullInactivePlayers();
		}
		this.emitPlayerList();
	}
};



// -----------------
// Lobby utility methods
// -----------------

Lobby.prototype.getPlayerCount = function() {
	return Object.keys(this.players).length;
};

Lobby.prototype.getActivePlayerCount = function() {
	var keys = Object.keys(this.players),
		count = 0;

	for(var i=0, l=keys.length; i<l; i++){
		var lobbyPlayer = this.players[keys[i]];
		if(lobbyPlayer.status === "active"){ count++; }
	}

	return count;
};

Lobby.prototype.getLobbyPlayer = function(player){
	var lobbyPlayer = this.players[player.id()];
	lobbyPlayer.isHost = (lobbyPlayer.id === this.host);
	return lobbyPlayer;
};

Lobby.prototype.selectHost = function(){
	var keys = Object.keys(this.players);
	for (var i = 0, l = keys.length; i < l; i++) {
		var lobbyPlayer = this.players[keys[i]];

		if(this.setHost(lobbyPlayer)){
			return true;
		}
	}

	return false;
};

Lobby.prototype.setHost = function(lobbyPlayer){
	if(lobbyPlayer.status !== "inactive" && lobbyPlayer.player.lobbyId === this.lobbyId){
		this.host = lobbyPlayer.id;
		return true;
	}
	return false;
};

Lobby.prototype.cullInactivePlayers = function(){
	var keys = Object.keys(this.players);

	for (var i = 0, l = keys.length; i < l; i++) {
		var k = keys[i],
			lobbyPlayer = this.players[k];

		if(lobbyPlayer.status === "inactive" || lobbyPlayer.player.lobbyId !== this.lobbyId){
			delete this.players[k];
		}
	}
};

Lobby.prototype.resetLobby = function(){
	this.cullInactivePlayers();
	this.gameState.reset();
};



// -----------------
// Lobby status methods
// -----------------
Lobby.prototype.isPlaying = function() {
	return this.gameState.getState() === 'playing';
};

Lobby.prototype.isAvailable = function() {
	if(this.isLockedFromPlaying() || this.isLockedFromMaxPlayers()){
		return false;
	}
	return true;
};

Lobby.prototype.isLockedFromPlaying = function() {
	if(has(this.config.lockWhenPlaying)){
		return (this.config.lockWhenPlaying === true && this.gameState.getState() === 'playing');
	}
	// Default to locked when playing
	return (this.gameState.getState() === 'playing');
};

Lobby.prototype.isLockedFromMaxPlayers = function() {
	if(has(this.config.maxPlayersPerLobby)){
		return (this.getPlayerCount() === this.config.maxPlayersPerLobby);
	}
	return false;
};

Lobby.prototype.hasEnoughPlayersToStart = function() {
	if(has(this.config.minPlayersToStartGame)){
		return (this.getPlayerCount() >= this.config.minPlayersToStartGame);
	}
	return true;
};

module.exports = Lobby;