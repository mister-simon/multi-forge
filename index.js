/*
	.----------------.
	|M|--------------|
	|M|\\\\=(o)\\\\\\|
	|M|::::::::::::::|        ___
	 ``````|##|``````   ,----`   `-.
	       |##|____----`            
	       |##|
	       |--|   
	       |  |   ||-----------------||
	       |  |   ||   Welcome to    ||
	       |  |   || Multi  -  Forge ||
	       |  |   ||-----------------||
	       |__|        By Simon W
	       |FF|
	        ``
*/

// ----------------------------------
// Preparation Section
// ----------------------------------

// Required Classes
var serverFiles = './server/',

	Server = require(serverFiles + 'server/server'),
	PlayerList = require(serverFiles + 'server/playerList'),
	IoHandler = require(serverFiles + 'server/ioHandler'),
	LobbyManager = require(serverFiles + 'lobby/lobbyManager'),
	GameLoop = require(serverFiles + 'game/gameLoop');

// Require some Config files
var serverConfig = require('./config/server'),
	playerConfig = require('./config/player'),
	lobbyConfig = require('./config/lobby'),
	gameStateConfig = require('./config/gameState');


// ----------------------------------
// Swing the Multi-Forge Hammer!
// ----------------------------------

// Multi-Forge the fileserver	
var serverRoot = __dirname,
	server = new Server(serverRoot, serverConfig);

// Multi-Forge Socket.IO things!
var playerList = new PlayerList(playerConfig.initial),
	ioHandler = new IoHandler(server.io, playerList);

// Multi-Forge Lobbies
var lobbyManager = new LobbyManager(lobbyConfig, gameStateConfig, server.io, playerList);

// Game Loop
var gameLoop = new GameLoop(lobbyManager);