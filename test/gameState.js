var assert = require('assert');
var should = require('should');
var copy = require('deepcopy');

var GameState = require('../server/game/gameState'),
	originalGameStateConfig = require('../config/gameState');

var LobbyManager = require('../server/lobby/lobbyManager'),
	lobbyManager = new LobbyManager({ lobbies:{} }, originalGameStateConfig, {}, { on: function(){} });

// Optimise gameState like lobbyManager does
var gameStateConfig = lobbyManager.optimiseGameConfig(copy(originalGameStateConfig));


// Mock a few dependencies for injection
function mockLobby(){
	this.trigger = null;
	
	this.on = function(event, trigger){
		this.trigger = trigger;
	};

	this.mockPlayerListUpdate = function(playerList){
		if(this.trigger !== null){
			this.trigger(playerList);
		}
	};
}

var mockGuestPlayer = {
	id: 0,
	isHost: false
},
mockHostPlayer = {
	id: 1,
	isHost: true	
},
mockFullPlayerList = {
	0: mockGuestPlayer,
	1: mockHostPlayer
}
// end mockmockmock



// Initialise things kinda easily.
var lobby, gameState, createGameState = function(config, getPlayerList){
	lobby = new mockLobby({});
	gameState = new GameState(config, getPlayerList, lobby);
};

// Begin testing
describe('Game state module', function () {
	describe('state changes', function () {
		it('user config file should create working gameState', function () {
			createGameState.bind(this, gameStateConfig).should.not.throw();
		});

		it('should initialise as a "Lobby" game state', function() {
			createGameState(gameStateConfig);
			gameState.getState().should.equal("lobby");
		});

		it('should then move to "preparing" state', function() {
			gameState.prepare();
			gameState.getState().should.equal("preparing");
		});

		it('should then move to "playing" state', function() {
			gameState.start();
			gameState.getState().should.equal("playing");
		});

		it('should then move to "stopped" state', function() {
			gameState.stop();
			gameState.getState().should.equal("stopped");
		});

		it('should then reset to "lobby" state', function() {
			gameState.reset();
			gameState.getState().should.equal("lobby");
		});
	});

	// For a "preparing" game, test a host can create entities + update players
	var mockEntity = {
		type: null,
		serverId: null,
	};


	describe('"preparing" state updates', function () {
		beforeEach(function(){
			createGameState(gameStateConfig);
			lobby.mockPlayerListUpdate(mockFullPlayerList);
			gameState.prepare();

			if(originalGameStateConfig.entityPermissions.public.length > 0){
				mockEntity.type = originalGameStateConfig.entityPermissions.public[0];
			}
		});
		
		// Defaults
		it('should return default players data', function() {
			var defaultProperties = Object.keys(gameStateConfig.defaults.players);
			
			gameState.getCurrent().players.should.matchEach(function(it){
				it.should.have.properties(defaultProperties);
			});
		});
		
		// New entities
		it('should not accept new entities from Guest', function() {
			mockEntity.serverId = mockGuestPlayer.id + '-' + 0;
			gameState.createEntity(mockGuestPlayer, mockEntity);
			
			gameState.getUpdated().entities.should.be.empty;
		});

		it('should accept new entities from Host', function() {
			mockEntity.serverId = mockHostPlayer.id + '-' + 0;
			gameState.createEntity(mockHostPlayer, mockEntity);
			
			gameState.getUpdated().entities.should.not.be.empty;
		});

		// Destroy entities
		it('should not accept deletions of entities from Guest', function() {
			mockEntity.serverId = mockHostPlayer.id + '-' + 0;

			gameState.createEntity(mockHostPlayer, mockEntity);

			gameState.destroyEntity(mockGuestPlayer, mockEntity);
			
			gameState.getUpdated().entities.should.not.be.empty;
		});

		it('should accept deletions of entities from Host', function() {
			mockEntity.serverId = mockHostPlayer.id + '-' + 0;

			gameState.createEntity(mockHostPlayer, mockEntity);
			gameState.destroyEntity(mockHostPlayer, mockEntity);
			
			gameState.getUpdated().entities.should.be.empty;
		});

		// Update either players / entities
		it('should not accept update from Guest', function() {
			var data = gameState.getUpdated(),
				dataDupe = copy(data);

			dataDupe.players[mockGuestPlayer.id].custom.score = 8008135;

			gameState.update(mockGuestPlayer, dataDupe);

			data.should.not.eql(dataDupe);
		});

		it('should accept update from Host', function() {
			var data = gameState.getUpdated(),
				dataDupe = copy(data);

			dataDupe.players[mockHostPlayer.id].custom.score = 1337;

			gameState.update(mockHostPlayer, dataDupe);

			data.should.eql(dataDupe);
		});
	});



	
	describe('"playing" state updates', function () {
		beforeEach(function(){
			createGameState(gameStateConfig);
			lobby.mockPlayerListUpdate(mockFullPlayerList);
			gameState.prepare();
			gameState.start();

			if(originalGameStateConfig.entityPermissions.public.length > 0){
				mockEntity.type = originalGameStateConfig.entityPermissions.public[0];
			}
		});
		
		// Defaults
		it('should return default players data', function() {
			var defaultProperties = Object.keys(gameStateConfig.defaults.players);
			
			gameState.getCurrent().players.should.matchEach(function(it){
				it.should.have.properties(defaultProperties);
			});
		});

		it('entityPermissions configuration exists', function() {
			gameStateConfig.entityPermissions.should.be.ok;
		});
		
		// New entities
		it('should accept new "public" entities from Guest', function() {
			mockEntity.serverId = mockGuestPlayer.id + '-' + 0;

			if(originalGameStateConfig.entityPermissions.public.length > 0){
				mockEntity.type = originalGameStateConfig.entityPermissions.public[0];

				gameState.createEntity(mockGuestPlayer, mockEntity);
				
				gameState.getUpdated().entities.should.not.be.empty;
			}
		});

		it('should not accept new "host" entities from Guest', function() {
			mockEntity.serverId = mockGuestPlayer.id + '-' + 0;

			if(originalGameStateConfig.entityPermissions.host.length > 0){
				mockEntity.type = originalGameStateConfig.entityPermissions.host[0];

				gameState.createEntity(mockGuestPlayer, mockEntity);
				
				gameState.getUpdated().entities.should.be.empty;
			}
		});

		it('should accept new "public" entities from Host', function() {
			mockEntity.serverId = mockHostPlayer.id + '-' + 0;

			if(originalGameStateConfig.entityPermissions.public.length > 0){
				mockEntity.type = originalGameStateConfig.entityPermissions.public[0];

				gameState.createEntity(mockHostPlayer, mockEntity);
				
				gameState.getUpdated().entities.should.not.be.empty;
			}
		});

		it('should accept new "host" entities from Host', function() {
			mockEntity.serverId = mockHostPlayer.id + '-' + 0;

			if(originalGameStateConfig.entityPermissions.host.length > 0){
				mockEntity.type = originalGameStateConfig.entityPermissions.host[0];

				gameState.createEntity(mockHostPlayer, mockEntity);
				
				gameState.getUpdated().entities.should.not.be.empty;
			}
		});

		// Destroy entities
		it.skip("should mark Guest's entities for deletion when deleted by Guest", function() {
			mockEntity.serverId = mockGuestPlayer.id + '-' + 0;

			gameState.createEntity(mockGuestPlayer, mockEntity);
			gameState.destroyEntity(mockGuestPlayer, mockEntity);

			var updatedEntity = gameState.getUpdated().entities[mockEntity.serverId];
			updatedEntity.should.have.property('destroyedByPlayerId',mockGuestPlayer.id);
		});

		it('should accept deletions of entities from Host', function() {
			mockEntity.serverId = mockHostPlayer.id + '-' + 0;

			gameState.createEntity(mockHostPlayer, mockEntity);
			gameState.destroyEntity(mockHostPlayer, mockEntity);
			
			gameState.getUpdated().entities.should.be.empty;
		});

		// Update either players / entities
		it('should accept player updates from Guest', function() {
			var data = gameState.getUpdated(),
				dataDupe = copy(data);

			dataDupe.players[mockGuestPlayer.id].custom.score = 8008135;

			gameState.update(mockGuestPlayer, dataDupe);

			data.should.eql(dataDupe);
		});

		it("should not accept non-self player updates from Guest", function() {
			var data = gameState.getUpdated(),
				dataOriginalDupe = copy(data),
				dataDupe = copy(data);

			dataDupe.players[mockHostPlayer.id].custom.score = -1000000;

			gameState.update(mockGuestPlayer, dataDupe);

			data.should.eql(dataOriginalDupe);
		});

		it('should accept player updates from Host', function() {
			var data = gameState.getUpdated(),
				dataDupe = copy(data);

			dataDupe.players[mockHostPlayer.id].custom.score = 1337;

			gameState.update(mockHostPlayer, dataDupe);

			data.should.eql(dataDupe);
		});

		it('should accept non-self updates from Host', function() {
			var data = gameState.getUpdated(),
				dataDupe = copy(data);

			dataDupe.players[mockGuestPlayer.id].custom.score = 1337;

			gameState.update(mockGuestPlayer, dataDupe);

			data.should.eql(dataDupe);
		});
	});
});