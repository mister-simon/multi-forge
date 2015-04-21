// Preloader
var Preloader = (function(){
	function Pre(game){}
	
	Pre.prototype.init = function() {
		this.input.maxPointers = 1;
		this.stage.disableVisibilityChange = true;
		this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		this.scale.setScreenSize(true);
	};

	Pre.prototype.preload = function() {
		this.gotLobbies = false;

		// Loading message
	    this.add.text(config.hsize.w, config.hsize.h - 30, "Loading...", config.text.title).anchor.setTo(0.5, 0.5);
	    this.add.text(config.hsize.w, config.hsize.h + 30, "Connecting to Server...", config.text.title).anchor.setTo(0.5, 0.5);

		// Assets
		this.load.image('background',		'img/background.png');
		this.load.image('title',			'img/title-banner.png');
		this.load.image('menu',				'img/btn-back.png');
		this.load.image('overlay',			'img/hud-background.png');

		// Player Entities
		this.load.spritesheet('player',		'img/players.png', 47, 47, 8, 0, 1);
		this.load.image('bullet',			'img/bullet.png');

		// Enemies
		this.load.image('asteroid-large',	'img/asteroid-1.png');
		this.load.image('asteroid-small',	'img/asteroid-2.png');
	};

	Pre.prototype.update = function() {
		if(this.load.hasLoaded && connection.isConnected() && this.gotLobbies === false){
			this.gotLobbies = true;
			connection.send('lobby','getLobbies', null,
				// Success!
				function(lobbies){
					gameData.lobbyTypes = lobbies;
					this.game.state.start('menu');
				}.bind(this),
				// Failure...
				function(err){
					this.gotLobbies = false;
				}

			);			
		}
	};
	return Pre;
})();