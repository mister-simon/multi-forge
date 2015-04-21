var Connection = (function(socket){
	// Expose your socket :F. Only for testing purporses.
	window.socket = socket;

	var debug = false;

	var APIs = {
		lobby:{
			'getLobbies':{
				event:'lobby/getLobbies',
				direction: 'both'
			},
			'join':{
				event:'lobby/join',
				direction: 'both'
			},
			'leave':{
				event:'lobby/leave',
				direction: 'both'
			},
			'update':{
				event:'update/lobby/players',
				direction: 'in'
			}
		},
		gameState:{
			'prepare':{
				event: 'game/prepare',
				direction: 'both'
			},
			'start':{
				event: 'game/start',
				direction: 'both'
			},
			'stop':{
				event: 'game/stop',
				direction: 'both'
			},
			'reset':{
				event: 'game/reset',
				direction: 'both'
			},
			'update':{
				event: 'update/game/state',
				direction: 'in'
			}
		},
		game:{
			'serverUpdate': {
				event: 'update/game',
				direction: 'in'
			},
			'update': {
				event: 'game/update',
				direction: 'out'
			},
			'createEntity': {
				event: 'game/createEntity',
				direction: 'both'
			},
			'destroyEntity': {
				event: 'game/destroyEntity',
				direction: 'both'
			}
		}
	};

	// Constructor + event emitter
	function Conn(){
		this.connected = false;
		this.awaitingResponse = {};
		this.sendable = {};
		this.apiList = {
			responses:[],
			updates:[],
			sendable:[]
		};
		this.bindAPIs();
	}

	// Proto event emitter this class
	var Emitter = Object.create(EventEmitter);
	Conn.prototype = Emitter.prototype;

	// Methods in this madness...
	Conn.prototype.bindAPIs = function(){
		// Bind the basic events
		socket.on('connect', this.connect.bind(this));
		socket.on('reconnect', this.reconnect.bind(this));
		socket.on('disconnect', this.disconnect.bind(this));
		this.apiList.updates.push('connect', 'reconnect', 'disconnect');
		
		// Bind all the other events (see var APIs).
		for(var group in APIs){
			this.sendable[group] = [];

			// Set of APIs in group
			var APIGroup = APIs[group];
			for(var APIName in APIGroup){
				// Current API
				var API = APIGroup[APIName];

				// Ignore improperly formatted APIs...
				if(!has(API.direction) || !has(API.event)){ continue; }

				// Send + response events
				if(API.direction === 'both'){
					this.registerSendable(group, APIName);
					this.registerEvent('response/'+API.event, group, APIName);
					this.apiList.responses.push(group+'.'+APIName);
					this.apiList.sendable.push([group,APIName]);

				// Events from server
				} else if(API.direction === 'in'){
					this.registerEvent(API.event, group, APIName);
					this.apiList.updates.push(group+'.'+APIName);

				// Events to server
				} else if(API.direction === 'out'){
					this.registerSendable(group, APIName);
					this.apiList.sendable.push([group,APIName]);
				}
			}
		}
	};

	// Util
	Conn.prototype.isConnected = function(){
		return this.connected;
	};

	// Bind basic socket interactions	
	Conn.prototype.connect = function(){
		this.connected = true;
		this.emit('connect');
	};
	Conn.prototype.reconnect = function(){
		this.connected = true;
		this.emit('reconnect');
	};
	Conn.prototype.disconnect = function(){
		this.connected = false;
		this.emit('disconnect');
	};

	// Register, send and receive valid events
	Conn.prototype.registerSendable = function(group, APIName){
		this.sendable[group].push(APIName);
	};

	Conn.prototype.registerEvent = function(event, group, APIName){
		socket.on(event, this.receiveEvent.bind(this, group, APIName));
	};

	Conn.prototype.send = function(group, APIName, args, success, error){
		// Not connected?
		if(this.connected === false){
			if(has(error)){
				error({ msg: 'Not connected to server' });
			}
			return;
		}

		// Not sendable?
		if(!has(this.sendable[group]) || this.sendable[group].indexOf(APIName) === -1){
			if(has(error)){
				error({ msg: 'APIName not listed as "sendable"', group: group, APIName: APIName });
			}
			return;
		}

		// Seems legit
		if(APIs[group][APIName].direction === 'both'){
			this.awaitingResponse[group+'.'+APIName] = { success: success, error: error };
		}

		// Sendit
		if(debug){
			console.log("---------------------");
			console.log("Sending: ", APIs[group][APIName].event);
			console.log("Data:    ", args);
		}
		
		socket.emit(APIs[group][APIName].event, args);
	};

	Conn.prototype.receiveEvent = function(){
		var args = getArgs(arguments);

		var group = args.shift(),
			APIName = args.shift();

		var isResponse = (this.sendable[group].indexOf(APIName) !== -1);

		var status = isResponse ? args.shift() : true,
			data = args.shift();


		if(debug){
			console.log("---------------------");
			console.log('group:      ', group);
			console.log('APIName:    ', APIName);
			console.log('isResponse: ', isResponse);
			console.log('status:     ', status);
			console.log('data:       ', data);
		}

		
		if(isResponse){
			var awaitedResponse = this.awaitingResponse[group+'.'+APIName];
			
			if(has(awaitedResponse)){
				if(status === 'success' && has(awaitedResponse.success) && awaitedResponse.success !== null){
					awaitedResponse.success(data);
				} else if(status === 'error' && has(awaitedResponse.error) && awaitedResponse.error !== null){
					awaitedResponse.error(data);
				}
				delete this.awaitingResponse[group+'.'+APIName];
			}
		}
		this.emit(group+'.'+APIName, data);
	};

	return Conn;
})(io());