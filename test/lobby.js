var assert = require('assert');
var should = require('should');

var Lobby = require('../server/lobby/lobby'),
	lobbyConfig = require('../config/lobby'),
	gameStateConfig = require('../config/gameState');

var lobby, createLobby = function(config){
	lobby = new Lobby(0, config, gameStateConfig);
};

var singularityLobbyConfig = {
		type : "singularity",
		maxPlayersPerLobby: 1,
		minPlayersToStartGame: 1
	},
	minimalistLobbyConfig = {
		type : "minimalist",
		minPlayersToStartGame: 1
	};

describe('Lobby module', function () {
	it('should create a lobby', function () {
		createLobby(singularityLobbyConfig);
		lobby.isAvailable().should.be.true;
	});
	
	it('should allow minimum requirements', function () {
		createLobby(minimalistLobbyConfig);
		lobby.isAvailable().should.be.true;
	});

	it('should throw an error with no config provided', function () {
		createLobby({});
		lobby.isAvailable.should.throw();
	});


	// Test user created lobbies
	var userLobbies = lobbyConfig.lobbies,
		lobbyKeys = Object.keys(userLobbies);

	for (var i = 0, l = lobbyKeys.length; i < l; i++) {
		var lobbyConfigName = lobbyKeys[i];

		it(lobbyConfigName + ' should not throw an error', function () {
			createLobby.bind(this,userLobbies[lobbyConfigName]).should.not.throw();
		});

		it(lobbyConfigName + ' should be available', function () {
			createLobby(userLobbies[lobbyConfigName]);
			lobby.isAvailable().should.be.true;
		});
	}
});