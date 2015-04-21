// ---------------------------------- 
// Configuration options for lobbies
// ---------------------------------- 

// Game State configs will be injected
var lobbyConfig = { gameState: {} };

lobbyConfig.rules = {
	// Todo

	/*customPlayerData:{
		nickname:{
			type: "string",
			maxLength: 30
		}
	}*/
};

/*

// Given a lobby configuration like random:{ ... },
// you can access this named lobby like so:
socket.emit('lobby/random/join',{ ... });

// Or find a list of lobbies:
socket.emit('lobby/getLobbies',{ ... });

// Then once the Player becomes "lobbied":
socket.emit('lobby/someAction',{ ... });
socket.emit('game/someAction',{ ... });

*/

lobbyConfig.lobbies = {
	"4-Player":{
		type : "Random",
		maxLobbies: 30,
		maxPlayersPerLobby: 4,
		minPlayersToStartGame: 4,
		lockWhenPlaying: true	// Players can't join mid-game
	},
	"Head to Head":{
		type : "Random",
		maxPlayersPerLobby: 2,
		minPlayersToStartGame: 2
	},
	"Single Player":{
		type : "Random",
		active:true,
		maxPlayersPerLobby: 1,
		minPlayersToStartGame: 1
	}
};

module.exports = lobbyConfig;