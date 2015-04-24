// Menu
var Menu = (function(){
	function Menu(Menu){}
	Menu.prototype.preload = function() { };
	Menu.prototype.create = function() {
		this.game.add.tileSprite(0, 0, config.size.w, config.size.h, 'background');

		// Lets have some fun
    	this.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.addRandomSpaceShips();

    	// Add the overlay to create a double background effect
		this.game.add.tileSprite(0, 0, config.size.w, config.size.h, 'overlay');


		// Ensure you're not in a lobby
		gameData.lobbyData = null;
		connection.send('lobby','leave');

		// Render the buttons
		this.renderButtons();

		// Add teh rest
		this.game.add.sprite(180, 70, 'title');
	};

	Menu.prototype.renderButtons = function(){
		// Make some buttons for available lobby types
		var lobbyLength = gameData.lobbyTypes.length;

		if(lobbyLength > 0){
			var repetitions = 0;

			for(var i=0; i < lobbyLength; i++){
				var lobbyName = gameData.lobbyTypes[i],
					selected = (i===0);

				var text = this.add.text(config.hsize.w, (config.hsize.h / 1.15) + (100 * i), lobbyName, config.text.menu);
				text.anchor.setTo(0.5, 0.5);

    			text.inputEnabled = true;

    			// Hover events - Over
    			text.events.onInputOver.add(function(text){
    				if(text.isSelected !== true){
    					text.setStyle(config.text.menuHover);
    				}
    			}, this);

    			// - Out
    			text.events.onInputOut.add(function(text){
    				if(text.isSelected !== true){
    					text.setStyle(config.text.menu);
    				}
    			}, this);

    			// Click event - Down
    			text.events.onInputDown.add(function(text){
    				if(text.isSelected !== true){
    					text.setStyle(config.text.menuSelected);
    				}
    			}, this);

    			// - Up
    			text.events.onInputUp.add(function(text){
    				text.isSelected = true;
    				gameData.selectedLobby = text._text;
    				this.joinLobby();
    			}, this);
			}
		} else {
	    	this.add.text(config.hsize.w, config.hsize.h - 30, "No lobbies found :(", config.text.scaryError).anchor.setTo(0.5, 0.5);
		}
	}

	Menu.prototype.addRandomSpaceShips = function(){
		var sprites = config.playerSprites,
			colours = Object.keys(sprites.colours);

		var ships = {};


		for (var r = 0; r < 5; r++) {
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

	Menu.prototype.joinLobby = function(){
		connection.send('lobby','join', gameData.selectedLobby,
			function(lobbyData){
				gameData.lobbyData = lobbyData;
				gameData.me = { data: gameData.lobbyData.players[lobbyData.yourId] };
				
				connection.on('gameState.update', function(newState){
					gameData.lobbyData.gameState.meta.state = newState;
				});

				this.game.state.start('game');
			}.bind(this),
			function(err){
				console.log(err);				
				this.game.state.start('menu');
			}.bind(this)
		);
	};

	Menu.prototype.update = function() {
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

			this.screenWrap(sprite);
		}
	};

	Menu.prototype.screenWrap = function(sprite) {
	    if (sprite.x < 0){
	        sprite.x = this.game.width;
	    } else if (sprite.x > this.game.width){
	        sprite.x = 0;
	    }
	    
	    if (sprite.y < 0){
	        sprite.y = this.game.height;
	    } else if (sprite.y > this.game.height){
	        sprite.y = 0;
	    }
	};
	return Menu;
})();