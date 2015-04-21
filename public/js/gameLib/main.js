(function(){
	var lobbyListUL = document.getElementById('lobbyList'),
		lobbyLeaveBtn = document.getElementById('lobbyListLeave'),
		playerListUL = document.getElementById('playerList');


	// Init
	var connection = new Connection(),
		lobbyList = new LobbyList(lobbyListUL, lobbyLeaveBtn, connection),
		playerList = new PlayerList(playerListUL, connection);

	// -------------
	// Start the game!
	// -------------

	// Poll for lobbies
	connection.callAPI('lobby/getLobbies');

	// Test game mock stuff
	window.startGame = function(){
		if(playerList.you.isHost){
			connection.callAPI('game/prepare');
		}
	};

	connection.on('responsePrepare', function(data){
		// New data... Do something cool with it, add to it and stuff.
		console.log("RESPONSEPREPARE",data);

		var myId = playerList.yourId,
			counter = 0;

		for(var i = 0, l = 10; i < l; i++){
			var entityId = myId+'-'+counter++;

			data.gameState.entities[entityId] = {
				// Important server things
				createdByPlayerId: myId,
				destroyedByPlayerId: null,
				serverId: entityId,
				type: "asteroid",

				// Other things
				pos: { x: 0, y: 0 },
				vel: { x: 1, y: 1 }
			};
		}


		console.log("PREPARATION DONE",data);

		// Tell it to start + pass back new data
		connection.callAPI('game/start', data);

		setTimeout(function(){
			connection.callAPI('game/stop');
		}, 2500);
	});


	connection.on('responseStartError', function(data){
		console.log("THERE WAS AN ERROR STARTING!");
	});


	connection.on('responseStop', function(data){
		setTimeout(function(){
			connection.callAPI('game/reset');
		}, 2500);
	});

	// Make game GO!
	var gameData = null;

	connection.on('gameUpdate',function(data){
		gameData = data;
	});

	connection.on('gameUpdateError',function(data){
		console.log("HELLO THERE!", data);
	});

	connection.on('gameStateChange', function(state){
		if(state === 'playing'){
			console.log("STARTED GAME!");

			// Spam updates while the game is running
			// var counter = 0,
			// 	thisInterval = setInterval(function(){
			// 		if(gameData !== null){
			// 			if(counter++ >= 250){
			// 				clearInterval(thisInterval);
			// 			} else {
			// 				gameData.players[playerList.yourId].pos.x += 1;
			// 				gameData.players[playerList.yourId].pos.y += 1;
			// 				connection.callAPI('game/update', gameData);
			// 			}
			// 		}
			// 	},(1000/60));
		}

		if(state === 'stopped'){
			console.log("GAME ENDED!", gameData);
		}
	});
})();