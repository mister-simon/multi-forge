# Multi-Forge

A configurable node multiplayer server, designed for HTML5 games.

## What's In The Current Build
> Current Build: Foundary

In this incarnation of the project, we have the solid foundation for a customisable
multiplayer server, running on websockets.

It's been designed to be as easy to set up as possible, and I really hope it delivers.
If you're having issues, feel free to let me know and I'll try to help.

With that said, check the content below for a full explanation of what the server can do.

## Getting Started

Make sure you've got node installed, you can [Find Node Here](https://nodejs.org/). Then from the terminal, run:

```bash
npm install
```

## Connecting With Your Game

By default the server uses Express to serve the files in `public` folder. Add your game files there.

Next, load [socket.io](http://socket.io/):

```html
<script src="https://cdn.socket.io/socket.io-1.2.0.js"></script>
```

If you want to make things easier, include the files in `public/js/multi-forge-client`:

```html
<script src="js/multi-forge-client/eventEmitter.min.js"></script>
<script src="js/multi-forge-client/lib.js"></script>
<script src="js/multi-forge-client/connection.js"></script>
```

When you add `connection.js` to your page, it exposes the class `Connection`.

```js
var connection = new Connection();
```

If you're running the game from the `public` folder, the `Connection` will automatically
link up with [socket.io](http://socket.io/) to begin communication with the server.

## Customising the Multi-Forge server

Head to the `config` folder and have a browse,
they're all well commented to explain.

### gameState.js

Very important to customise this section.
It specifies what data you want the server
to expect, and how it will treat it.

### lobby.js

Also important to customise this section.
It specifies all of the lobby rules, such as
number of Players per lobby, minumum number to start a game and the maximum
number of each lobby type to create.

### server.js

If you want to reconfigure what your game's folder is or what port the server should run on.

### player.js

Allows you to add custom data to a player.

## A Heavily Commented Example Script

```js
// Initialise the connection
var connection = new Connection();

// Check when we are connected.
connection.on('connect',function(){

	// To ask the server what lobbies types are available
	connection.send('lobby', 'getLobbies', null, function(lobbiesList){
		// Maybe use the list to construct a menu
		// If you want to join the first one in the list
		connection.send('lobby', 'join', lobbiesList[0], joinedLobby,
		function(err){
			// Or maybe no lobbies were available or something... :(
			console.log(err);
		});
	});

	// When you've joined a lobby you gain new powers
	var entityCounter = 0,
		lobbyDetails,
		yourId = null,
		you,
		isHost;

	function joinedLobby(details){
		// Store details
		lobbyDetails = details;
		
		// Reset the entity counter when you join.
		// You'll need this later.
		entityCounter = 0;

		// You will be given your id in the lobby details
		yourId = lobbyDetails.yourId;

		// Find out about yourself
		you = lobbyDetails.players[yourId];

		// Maybe you're the lobby host
		isHost = you.isHost;

		// If you're the host, maybe you want to start a game
		if(isHost){
			connection.send('gameState','prepare',null,function(){
				// During the preparing stage the Host can prepare the 
				// 	game area by spawning stuff or updating player positions
				var entity = {
					pos:{x:0,y:0}
				};

				// Make sure to add these properties
				entity.type = "enemy";
				entity.serverId = (lobbyDetails.yourId + "-" + entityCounter++);

				// Create an entity, then start the game
				connection.send('game','createEntity',entity,function(){
					connection.send('gameState','start');
				},function(err){
					// If the serverId doesn't match up
					// or the entity doesn't exist
					// you'll get a helpful error
					console.log(err);
				});
			});
		}
	}

	// Listen for updates to the lobby Players list
	connection.on('lobby.update',function(newPlayerList){
		lobbyDetails.players = newPlayerList;
	});

	// Listen for updates from the game
	connection.on('game.serverUpdate',function(updates){
		lobbyDetails.gameState.players = updates.players;
		lobbyDetails.gameState.entities = updates.entities;
	});

	// Make some player data to play with
	var sprite = {
		pos:{x:0,y:0}
	};

	// Listen for updates to the game state
	connection.on('gameState.update',function(newState){
		// Update the lobbyDetails appropriately.
		lobbyDetails.gameState.meta.state = newState;

		if(newState === 'preparing'){
			// The game is about to start
			// The host is setting things up
			// Reset yourself and wait
			sprite.movable = false;
			sprite = lobbyDetails.gameState.players[yourId];
		}
		if(newState === 'playing'){
			// The game just started
			// So you can now start fiddling with your player data
			sendPlayerUpdate();
		}
		if(newState === 'stopped'){
			// Game over man!
			// Show scores, who's the winner?
			// YOU?! Fanfare, balloons!
		}
		if(newState === 'lobby'){
			// Game was reset
			// Players can now leave or await a rematch
		}
	});

	// Then you can integrate the updates into a game loop
	// 	Hint: When making a game, don't use setInterval
	// 	Anyway... this works for demonstration purposes
	setInterval(updateGame,1000/60);

	function updateGame(){
		if(yourId !== null){
			var isLobbied = (yourId !== null),
				isPlaying = (lobbyDetails.gameState.meta.state === 'playing');

			if(isLobbied && isPlaying){
				sendPlayerUpdate();
			}
		}
	}

	function sendPlayerUpdate(){
		// The format that the server expects
		// 	mirrors the format it sends to you.
		var updateData = { players:{} };

		// Apply physics in real-time, WHOA!
		sprite.pos.x += 20;

		// Update yourself
		updateData.players[yourId] = sprite;

		// The Host has the power to update other players
		// so in normal gameplay, only send your own player data
		connection.send('game','update',updateData);

		// Maybe you want to check an overlap with an entity and destroy it
		if(sprite.pos.x >= lobbyDetails.gameState.entities['0-0'].pos.x){
			connection.send('game','destroyEntity',{ serverId: '0-0' },null,
				function(err){
					// Deletion was rejected. Maybe you're not allowed
					// 	to destroy that entity.
					console.log(err);
				}
			);
		}
	}
});

// You may also want to listen for a disconnection / reconnection.
// I think you get the point by now though :P.

```

## Full API Spec

```js
console.log(connection.apiList)

/* 
	Responses are messages that return from the server
	after using a sendable event.

	There will also be event updates from the server which will be
	emitted from the connection.

	See previous step for how to send and listen.
{
   "responses":[
      "lobby.getLobbies",
      "lobby.join",
      "lobby.leave",
      "gameState.prepare",
      "gameState.start",
      "gameState.stop",
      "gameState.reset",
      "game.createEntity",
      "game.destroyEntity"
   ],
   "sendable":[
      ["lobby","getLobbies"],
      ["lobby","join"],
      ["lobby","leave"],
      ["gameState","prepare"],
      ["gameState","start"],
      ["gameState","stop"],
      ["gameState","reset"],
      ["game","update"],
      ["game","createEntity"],
      ["game","destroyEntity"]
   ],
   "updates":[
	  "connect",
	  "reconnect",
	  "disconnect",
      "lobby.update",
      "gameState.update",
      "game.serverUpdate"
   ]
}
*/
```

## Running Tests

After `npm install`, `npm run test`. 

Or install grunt globally:

```bash
npm install -g grunt-cli
```

And run grunt:

```bash
grunt
```

![Multi-Forge-Hammer](http://i.imgur.com/l5dEB2g.jpg)

Enjoy :3.