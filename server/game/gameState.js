var copy = require('deepcopy');

// Lib
function has(v){ return (typeof v !== 'undefined'); }
function test(v,d){ return has(v)?v:d; }

// Init
function GameState(config, getPlayerList, lobby){
	this.config = test(config, {});
	this.getPlayerList = test(getPlayerList, function(){ return {}; });

	// Current game state
	this.meta = { state: "lobby" };
	this.players = {};
	this.entities = {};

	// Updated game states (Processed each GameLoop step)
	this.updatedPlayers = {};
	this.updatedEntities = {};


	// Helpful for tracking things
	this.playerEntityIds = {};
	this.cachedPlayerList = {};

	lobby.on('playerListUpdate',this.cachePlayerList.bind(this));

	// Reset vars
	this.reset();
}

// Game Loop Updates
GameState.prototype.step = function() {
	// Check updates against rules and make amendments
	

	// Set current state to "updated" state.
	this.players = copy(this.updatedPlayers);
	this.entities = copy(this.updatedEntities);


	return this.getCurrent();
};

// State updates
GameState.prototype.reset = function(){
	this.meta = { state: "lobby" };

	this.players = this.updatedPlayers = {};
	this.entities = this.updatedEntities = {};
	this.playerEntityIds = {};
};

GameState.prototype.prepare = function(){
	this.meta.state = "preparing";

	var playerIds = Object.keys(this.cachedPlayerList);

	for (var i = 0, l = playerIds.length; i < l; i++) {
		var playerId = playerIds[i];
		this.players[playerId] = copy(this.config.defaults.players);
		this.playerEntityIds[playerId] = 0;
	}
};

GameState.prototype.start = function(){
	this.step();
	this.meta.state = "playing";
};

GameState.prototype.stop = function(){
	this.meta.state = "stopped";
};

GameState.prototype.createEntity = function(lobbyPlayer, data){
	// If the game isn't running, or the lobbyHost isn't creating start entities
	if(this.meta.state !== 'playing'){
		if(this.meta.state !== 'preparing'){
			return;
		} else if(!(lobbyPlayer.isHost)){
			return;
		}
	}


	var curPlayerEntityId = this.playerEntityIds[lobbyPlayer.id],
		entityId = lobbyPlayer.id + '-' + curPlayerEntityId;

	// Validate the new entity

	/* Expects:
	{	type: "bullet",
		serverId: '0-1',
		... More data 	  }
	*/

	if(!has(data.serverId)){
		return { msg: 'No serverId provided.' };
	}

	if(data.serverId !== entityId){
		return { msg:'Expected data.serverId = '+ entityId, serverId: entityId };
	}

	if(!has(data.type) || !has(this.config.entityPermissions[data.type])){
		return { msg: 'Unexpected/missing entity type.' };
	}

	if(!lobbyPlayer.isHost && this.config.entityPermissions[data.type] === 'host'){
		return { msg: 'Only Host can create those entities.' };
	}

	// Create the entity
	// Apply a direct link to the player to this entity
	var dataCopy = copy(data);

	dataCopy.createdByPlayerId = lobbyPlayer.id;
	dataCopy.destroyedByPlayerId = null;

	this.updatedEntities[entityId] = dataCopy;
	
	// Iterate that ID
	this.playerEntityIds[lobbyPlayer.id] += 1;
	

	// Tell lobby it was successful
	return true;
};

GameState.prototype.destroyEntity = function(lobbyPlayer, data){
	if(this.meta.state !== 'playing'){
		if(this.meta.state !== 'preparing'){
			return;
		} else if(!(lobbyPlayer.isHost)){
			return;
		}
	}

	if(!has(data.serverId)){ return { msg: 'No serverId provided.' }; }


	if(lobbyPlayer.isHost === false && this.config.rules.guestsSoftDeleteEntities === true){
		this.updatedEntities[data.serverId].destroyedByPlayerId = lobbyPlayer.id;
	} else {
		delete this.updatedEntities[data.serverId];
	}

	// Tell lobby it was successful
	return true;
};

GameState.prototype.update = function(lobbyPlayer, data){

	// If the game isn't running, or the lobbyHost isn't creating start entities
	if(this.meta.state !== 'playing'){
		if(this.meta.state !== 'preparing'){
			return;
		} else if(!(lobbyPlayer.isHost)){
			return;
		}
	}

	/* Expects:{
		players: {
			0: {
				id: 0,
				custom: { "score": 0 },
				pos: { "x":50, "y":50 },
				vel: { "x":0, "y":0 }
			},
			1: { ... }, ...
		}, 
		entities: {
			0-0: {
				type: "bullet",
				serverId: '0-1',
				... More data
			},
			0-1: { ... }, ...
		}		
	}
	*/

	var i, len, entityId;

	// Do player stuff
	if(has(data.players)){
		// If they're a host loop through data + apply to player updates
		if(lobbyPlayer.isHost){
			var playerKeys = Object.keys(data.players);
				len = playerKeys.length;

			for(i=0; i<len; i++){
				var playerId = playerKeys[i];
				if(has(data.players[playerId]) && has(this.updatedPlayers[playerId])){
					this.updatedPlayers[playerId] = data.players[playerId];
				}
			}

		// If they're not host, only apply new data to themselves
		} else {
			var newPlayerData = data.players[lobbyPlayer.id];
			if(has(newPlayerData)){
				this.updatedPlayers[lobbyPlayer.id] = newPlayerData;
			}
		}
	}

	// Do entities stuff
	if(has(data.entities)){
		var entityKeys = Object.keys(data.entities);
		len = entityKeys.length;

		// Players can update entities they created
		// (Except for who created / destroyed them)
		for(i=0; i<len; i++){
			entityId = entityKeys[i];
			var curEntity = this.updatedEntities[entityId];

			if(has(curEntity) && curEntity.createdByPlayerId === lobbyPlayer.id){
				this.updatedEntities[entityId] = data.entities[entityId];

				// Reapply any server critical info
				this.updatedEntities[entityId].serverId				= curEntity.serverId;
				this.updatedEntities[entityId].createdByPlayerId	= curEntity.createdByPlayerId;
				this.updatedEntities[entityId].destroyedByPlayerId	= curEntity.destroyedByPlayerId;
			}
		}
	}

	// Done :)
};

// Utils
GameState.prototype.cachePlayerList = function(newList){
	this.cachedPlayerList = newList;
};

GameState.prototype.getState = function(){
	return this.meta.state;
};

GameState.prototype.getUpdated = function() {
	return {
		players: this.updatedPlayers,
		entities: this.updatedEntities
	};
};

GameState.prototype.getCurrent = function() {
	return {
		players: this.players,
		entities: this.entities
	};
};


GameState.prototype.getClean = function() {
	var current = this.getCurrent();
	current.meta = this.meta;
	return current;
};

module.exports = GameState;