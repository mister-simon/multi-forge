// ServerData
var ServerData = (function(){
	function SD(connection){
		this.connection = connection;

		// List of lobbies
		this.lobbies = null;

		// The current lobby
		this.entityCounter = 0;
		this.lobby = null;

		// Current game state
		this.game = null;

		// Lobby data about yourself
		this.me = null;

		// Initialiser.
		this.deferredInit();
	}

	// Proto event emitter this class
	var Emitter = Object.create(EventEmitter);
	SD.prototype = Emitter.prototype;

	var validStates = ['prepare', 'start', 'stop', 'reset'];
	var nextStates = {
		lobby: 'prepare',
		preparing: 'start',
		playing: 'stop',
		stopped: 'reset'
	};




	// Initialisation
	SD.prototype.deferredInit = function() {
		if(this.connection.isConnected()){
			this.init();
		} else {
			this.connection.on('connect',this.init.bind(this));
		}
	};

	SD.prototype.init = function() {
		// Assign listeners
		// Lobby resetters
		this.connection.on('lobby.leave',this.resetLobby.bind(this));
		this.connection.on('disconnect',this.resetLobby.bind(this));

		// Updates
		connection.on('lobby.playersUpdate', this.playerListUpdate.bind(this));
		connection.on('gameState.update', this.gameStateUpdate.bind(this));
		connection.on('game.serverUpdate', this.gameUpdateIn.bind(this));

		// Start getting useful data
		this.getLobbies();
	};

	// Reset
	SD.prototype.resetLobby = function() {
		this.lobby = null;
		this.game = null;
		this.me = null;
	};





	// Dealing with data
	// Lobbies
	SD.prototype.getLobbies = function() {
		var assignLobbies = function(lobbies){
				this.lobbies = lobbies;
				this.initialised = true;
			}.bind(this);

		var tryAgain = function(){
				console.log("Couldn't get lobbies... Trying again.");
				setTimeout(this.getLobbies,1000);
			}.bind(this);

		this.connection.send('lobby','getLobbies', null, assignLobbies, tryAgain);
	};

	SD.prototype.joinLobby = function(lobbyName, joined, failure){
		if(!has(failure)) failure = function(){};

		var success = function(lobbyData){
			this.lobby = lobbyData;
			this.entityCounter = 0;

			this.game = this.lobby.gameState;
			this.me = this.lobby.players[lobbyData.yourId];

			this.game.newData = true;

			if(has(joined)){
				joined();
			}
		}.bind(this);

		this.connection.send('lobby','join', lobbyName, success, failure);
	};

	SD.prototype.leaveLobby = function(left, failure){
		if(!has(left)) left = function(){};
		if(!has(failure)) failure = function(){};

		this.connection.send('lobby','leave', null, left, failure);
	};

	SD.prototype.playerListUpdate = function(players){
		this.lobby.players = players;
		this.emit('lobby.playersUpdate', this.lobby.players);
	};





	// Game data
	SD.prototype.gameStateUpdate = function(newState){
		this.game.meta.state = newState;
		this.emit('gameState.update', newState);
	};

	SD.prototype.gameUpdateIn = function(newData){
		this.game.newData = true;
		this.game.players = newData.players;
		this.game.entities = newData.entities;
	};

	SD.prototype.setGameState = function(state, success, failure){
		if(this.me.isHost === true && validStates.indexOf(state) !== -1){
			connection.send('gameState', state, null, success, failure);
		}
	};

	SD.prototype.nextState = function(success, failure){
		var cur = this.game.meta.state;
		this.setGameState(nextStates[cur], success, failure);
	};




	// Updates
	SD.prototype.createEntity = function(entity, isRetry){
		entity.serverId = this.me.id + '-' + this.entityCounter;

		if(this.game.meta.state === 'playing' || this.game.meta.state === 'preparing'){
			this.entityCounter++;
		}

		this.connection.send('game', 'createEntity', entity, null, function(err){
			console.log(err);
			if(has(err.entityCounter)){
				this.entityCounter = err.entityCounter;
				if(!isRetry){
					this.createEntity(entity, true);
				}
			}
		}.bind(this));

		return entity;
	};

	SD.prototype.destroyEntity = function(entityId){
		this.connection.send('game', 'destroyEntity', { serverId: entityId });
	};

	SD.prototype.gameUpdate = function(data){
		this.connection.send('game', 'update', data);
	};


	return SD;
})();