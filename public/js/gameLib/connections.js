// ----------
// Events from the server
/* ----------
-> connection.on('emissionName',function(data){  });

getLobbies
lobbyJoin
lobbyLeave
lobbyPlayers
gameUpdate
gameStateChange

gamePrepareError
gameStartError
gameStopError
gameResetError

gameUpdateError
gameCreateEntityError
gameDestroyEntityError

// --------*/

var Connection = (function(socket){
	// Expose your socket :F.
	// only for testing purporses.
	window.socket = socket;

	// Define APIs in form:
	//	{"socketEvent" : "methodAlias", ..., ...}
	var APIs = {
		// General
		'connect'					: 'connect',
		'connect_error'				: 'connectError',
		'reconnect'					: 'reconnect',
		'reconnect_error'			: 'reconnectError',
		'disconnect'				: 'disconnect',

		// Lobby
		'response/lobby/getLobbies'	: 'responseGetLobbies',
		'response/lobby/leave'		: 'responseLeave',
		'response/lobby/join'		: 'responseJoin',
		'update/lobby/players'		: 'updatePlayers',

		// Game state
		'response/game/prepare'		: 'responsePrepare',
		'response/game/start'		: 'responseStart',
		'response/game/stop'		: 'responseStop',
		'response/game/reset'		: 'responseReset',
		'update/game/state'			: 'updateState',

		// In game
		'update/game'					: 'updateGame',
		'response/game/update'			: 'responseUpdate',
		'response/game/createEntity'	: 'responseCreateEntity',
		'response/game/destroyEntity'	: 'responseCreateEntity'
	}


	// Constructor + event emitter
	function Conn(){
		// Bind APIs
		for(var i in APIs){
			var methodAlias = APIs[i];
			if(has(this[methodAlias])) socket.on(i, this[methodAlias].bind(this));
		}
	}
	var Emitter = Object.create(EventEmitter);
	Conn.prototype = Emitter.prototype;

	// Allow people to call APIs
	Conn.prototype.callAPI = function(API, data) {
		socket.emit(API,data);
	};

	// Helpers
	Conn.prototype.failed = function(status,data){
		var isFailed = (status !== "success");
		// Todo: Add error emitters / handlers
		if(isFailed) console.log(status,':',data);
		return isFailed;
	};

	// Connections!
	Conn.prototype.connect 			= function()	{ socket.emit('lobby/getLobbies'); };
	Conn.prototype.connectError 	= function(err)	{ console.log("Connection error",err); }
	Conn.prototype.reconnect 		= function()	{  };
	Conn.prototype.reconnectError 	= function(err)	{ this.connectError(err); };
	Conn.prototype.disconnect 		= function()	{ this.connectError('Disconnected'); };

	// Lobby interactions
	Conn.prototype.responseGetLobbies = function(status,data){
		console.log('responseGetLobbies',status,data);
		if(this.failed(status, data)) return;
		this.emit('getLobbies',data);
	};

	Conn.prototype.responseJoin = function(status,data){
		console.log('responseJoin',status,data);
		if(this.failed(status, data)) return;
		this.emit('lobbyJoin',data);
	};

	Conn.prototype.responseLeave = function(status,data){
		console.log('responseLeave',status,data);
		if(this.failed(status, data)) return;
		this.emit('lobbyLeave',data);
	};

	Conn.prototype.updatePlayers = function(data){
		console.log('updatePlayers',data);
		this.emit('lobbyPlayers',data);
	};



	// Host privaleges
	Conn.prototype.responsePrepare = function(status,data){
		console.log('responsePrepare',status,data);

		if(this.failed(status, data)){
			this.emit('gamePrepareError',data);
		}
		
		this.emit('responsePrepare',data);
	};

	Conn.prototype.responseStart = function(status,data){
		console.log('responseStart',status,data);

		if(this.failed(status, data)){
			this.emit('gameStartError',data);
		}
		
		this.emit('responseStart',data);
	};

	Conn.prototype.responseStop = function(status,data){
		console.log('responseStop',status,data);

		if(this.failed(status, data)){
			this.emit('gameStopError',data);
		}
		
		this.emit('responseStop',data);
	};

	Conn.prototype.responseReset = function(status,data){
		console.log('responseReset',status,data);

		if(this.failed(status, data)){
			this.emit('gameResetError',data);
		}
		
		this.emit('responseReset',data);
	};



	// Game updates (For all)
	Conn.prototype.responseUpdate = function(status,data){
		console.log('responseUpdate',status,data);

		if(this.failed(status, data)) {
			this.emit('gameUpdateError',data);
		}
	};
	Conn.prototype.responseCreateEntity = function(data){
		console.log('responseCreateEntity',data);

		if(this.failed(status, data)) {
			this.emit('gameCreateEntityError',data);
		}
	};
	
	Conn.prototype.responseDestroyEntity = function(data){
		console.log('responseDestroyEntity',data);

		if(this.failed(status, data)) {
			this.emit('gameDestroyEntityError',data);
		}
	};


	Conn.prototype.updateGame = function(data){
		// console.log('updateGame',data);
		this.emit('gameUpdate',data);
	};

	Conn.prototype.updateState = function(data){
		console.log('updateState',data);
		this.emit('gameStateChange',data);
	};

	return Conn;
})(io());