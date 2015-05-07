// Aftermatch
var Aftermatch = (function(){
	function Aftermatch(Aftermatch){}

	Aftermatch.prototype.create = function() {
		this.game.add.tileSprite(0, 0, config.size.w, config.size.h, 'background');

		// Lets have some fun
    	this.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.addRandomSpaceShips();
		this.addRandomAsteroids();

    	// Add the overlay to create a double background effect
		this.game.add.tileSprite(0, 0, config.size.w, config.size.h, 'overlay');

		// Add teh rest
		this.game.add.sprite(180, 70, 'title');

		addBackBtn(this.game);

		// Show winner
		this.showWinner();
	};

	Aftermatch.prototype.showWinner = function(){
		this.status = "The Winner Is";
		this.title = this.add.text(config.hsize.w, (config.hsize.h / 1.15), this.status, config.text.title);
		this.title.anchor.setTo(0.5, 0.5);

		var highScore = { player: null, score: 0 };

		for(var p in serverData.game.players){
			var cur = serverData.game.players[p];

			if(cur.custom.score >= highScore.score){
				highScore.player = p;
				highScore.score = cur.custom.score;
			}
		}

		var subtitleText = 'Player '+highScore.player+': '+highScore.score;
		this.subtitle = this.add.text(config.hsize.w, config.hsize.h + (config.hsize.h * 0.15), subtitleText, config.text.subtitle);
		this.subtitle.anchor.setTo(0.5, 0.5);
	};

	Aftermatch.prototype.addRandomAsteroids = function(){
		var maxVelocity = 80;

		var asteroids = [];

		for (var i = 0; i < 7; i++) {
			var size = Math.random() > 0.45 ? 'small' : 'large';

			var sprite = this.game.add.sprite(Math.random() * config.size.w, Math.random() * config.size.h, 'asteroid-'+size);
			this.game.physics.enable(sprite, Phaser.Physics.ARCADE);

		    sprite.alpha = 0.15;
			sprite.anchor.set(0.5);
			sprite.rotation = Math.random() * 360;

			var rX = (Math.random() * (maxVelocity * 2)) - maxVelocity,
				rY = (Math.random() * (maxVelocity * 2)) - maxVelocity;

			sprite.body.velocity.add(rX, rY);
			sprite.body.angularVelocity = (Math.random() * 200) - 100;

			asteroids.push(sprite);
		}

		this.asteroids = asteroids;
	};

	Aftermatch.prototype.addRandomSpaceShips = function(){
		var sprites = config.playerSprites,
			colours = Object.keys(sprites.colours);

		var ships = {};

		for (var r = 0; r < 3; r++) {
			for (var i = 0, l = colours.length; i < l; i++) {
				// Grab data for specific ship
				var colour = colours[i],
					spriteFrames = sprites.colours[colour],
					spriteStart = sprites.startPos[colour];

				// Create ship sprite
				var sprite = this.game.add.sprite(spriteStart.x, spriteStart.y, 'player', spriteFrames.on);
				this.game.physics.enable(sprite, Phaser.Physics.ARCADE);

				sprite.anchor.set(0.5);
				sprite.rotation = spriteStart.r;

				sprite.body.maxAngular = 300;
			    sprite.body.maxVelocity.set(500);
			    sprite.body.drag.set(50);
			    sprite.alpha = 0.3;

			    sprite.spriteFrames = spriteFrames;

				// Store data
				ships[colour+r] = sprite;
			}
		};

		this.ships = ships;
	};

	Aftermatch.prototype.update = function() {
		var shipColours = Object.keys(this.ships);

		// Loop through ships
		for (var i = 0, l = shipColours.length; i < l; i++) {
			var colour = shipColours[i],
				spriteFrames = config.playerSprites.colours[colour],
				sprite = this.ships[colour];

			var accell = (Math.random()*300) - 200 << 0;
			if(accell > 0){
				this.game.physics.arcade.accelerationFromRotation(sprite.rotation - config.playerSprites.rotationOffset, accell, sprite.body.acceleration);
			}

			sprite.body.angularVelocity += (Math.round(Math.random()*50) - 25);

			if(accell > 50){
				sprite.frame = sprite.spriteFrames.on;
			} else {
				sprite.frame = sprite.spriteFrames.off;
			}

			screenWrap(sprite, this.game);
		}

		for (var i = 0, l = this.asteroids.length; i < l; i++) {
			screenWrap(this.asteroids[i], this.game);
		}
	};
	return Aftermatch;
})();