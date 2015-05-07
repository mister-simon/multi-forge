// Game globals
var connection = new Connection();
var serverData = new ServerData(connection);
var gameData = {};

// Initialiser
(function(){
	var game = new Phaser.Game(config.size.w, config.size.h, Phaser.AUTO, 'fasteroids');


	game.state.add('disconnected', Disconnected);
	game.state.add('preloader', Preloader);
	game.state.add('menu', Menu);
	game.state.add('lobby', Lobby);
	game.state.add('game', Game);
	game.state.add('aftermatch', Aftermatch);

	connection.on('disconnect', function(){
		game.state.start('disconnected');
	});

	connection.on('reconnect', function(){
		game.state.start('menu');
	});

	game.state.start('preloader');
})();