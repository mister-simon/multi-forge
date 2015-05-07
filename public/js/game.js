// Game
var Game = (function(){
	function Game(game){
		this.startingIn = 2;
	}

	var nextBullet = 0,
		bulletWait = 250,
		entityCounter = 0,
		livingBullets = [];

	Game.prototype.create = function() {
		console.log('gameStart',serverData._events);


		// Start physics engine
    	this.game.physics.startSystem(Phaser.Physics.ARCADE);

    	// Capture inputs
	    gameData.keys = this.game.input.keyboard.createCursorKeys();
	    this.game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);

	    // Add background
		this.game.add.tileSprite(0, 0, config.size.w, config.size.h, 'background');

    	// Reset players
    	this.resetPlayers();
    	
    	// Create a nice overlay + countdown
		this.overlay = this.game.add.tileSprite(0, 0, config.size.w, config.size.h, 'overlay');
		this.countDown = this.add.text(config.hsize.w, config.hsize.h, this.startingIn + 1, config.text.title);
		this.countDown.anchor.set(0.5, 0.5);




		// Track game state
		this.updateStateListener = this.onStateUpdated.bind(this);
		this.onStateUpdated(serverData.game.meta.state);

		// Bind listeners
		this.bindUpdateListeners();
	};

	Game.prototype.bindUpdateListeners = function(){
		serverData.on('gameState.update', this.updateStateListener);
	};

	Game.prototype.unbindUpdateListeners = function(){
		serverData.removeListener('gameState.update', this.updateStateListener);
	};

	Game.prototype.onStateUpdated = function(newState){
		console.log('Game:',newState);

		if(newState === 'preparing'){
			this.decrementCountdown();

		} else if(newState === 'playing') {
			this.resetScores();
			// this.game.state.start('lobby');

		} else if(newState === 'stopped'){
			this.game.state.start('aftermatch');

		}
	};

	Game.prototype.decrementCountdown = function(){
		this.game.time.events.add(Phaser.Timer.SECOND, function(){
			if(this.startingIn === -1){
				this.countDown.destroy();
				return;

			} else if(this.startingIn === 0){
				this.countDown.setText("GO!");
				this.overlay.destroy();
				serverData.nextState();

			} else {
				this.countDown.setText(this.startingIn);

			}
			this.startingIn--;

			this.decrementCountdown();
		}.bind(this));
	}

	Game.prototype.resetPlayers = function(){
		this.resetShips();
		this.createShips();
		this.assignShips();
	};

	Game.prototype.resetShips = function(){
		// Refresh all player game data
		for(var i in gameData.ships){
			var ship = gameData.ships[i];
			ship.sprite.kill();
			ship.score.destroy();
			ship.bullets.destroy();
		}

		if(!gameData.ships){
			gameData.ships = {};
		}
	};

	Game.prototype.resetScores = function(){
		// Refresh all player game data
		for(var i in gameData.ships){
			var ship = gameData.ships[i];
			ship.score.setText('0');
		}
	};

	Game.prototype.createShips = function(){
		// Get available colours
		gameData.playerColours = Object.keys(config.playerSprites.colours);

		// Reset their data
		for (var i = 0, l = gameData.playerColours.length; i < l; i++) {
			// Grab data for specific ship
			var colour = gameData.playerColours[i],
				spriteFrames = config.playerSprites.colours[colour],
				spriteStart = config.playerSprites.startPos[colour],
				spriteScore = config.playerSprites.scorePos[colour];

			// Store data
			var shipData = gameData.ships[colour] = { visible: false };

			// Create ship sprite
			var sprite = this.game.add.sprite(spriteStart.x, spriteStart.y, 'player', spriteFrames.off);
			sprite.visible = shipData.visible;
			sprite.anchor.set(0.5);
			sprite.rotation = spriteStart.r;

			this.game.physics.enable(sprite, Phaser.Physics.ARCADE);

		    sprite.body.drag.set(50);
		    sprite.body.maxVelocity.set(500);
			
			// Assign the ship a group of bullets
			var bullets = this.game.add.group();
		    bullets.enableBody = true;
		    bullets.physicsBodyType = Phaser.Physics.ARCADE;

		    bullets.createMultiple(10, 'bullet');
		    bullets.setAll('anchor.x', 0.5);
		    bullets.setAll('anchor.y', 0.5);

		    // Create scoreboards for each ship
		    var score = this.game.add.text(spriteScore.x, spriteScore.y, "0", config.text["score-"+colour]);
		    score.visible = shipData.visible;
		    score.anchor.setTo(spriteScore.ax, spriteScore.ay);

		    // Set each ship into game data
			shipData.pilot = null;
			shipData.sprite = sprite;
			shipData.spriteFrames = spriteFrames;
			shipData.score = score;
			shipData.bullets = bullets;
		}
	}

	Game.prototype.assignShips = function(){
		// Assign players to ships
		var lobbyPlayers = Object.keys(serverData.lobby.players);

		for(var i = 0, lobbyPlayersLength = lobbyPlayers.length; i<lobbyPlayersLength; i++){
			var playerId = lobbyPlayers[i],
				player = serverData.lobby.players[playerId];

			// If ship isn't taken, assign it.
			for (var j = 0, l = gameData.playerColours.length; j < l; j++) {
				var colour = gameData.playerColours[j],
					ship = gameData.ships[colour];

				// Ship is empty
				if(ship.pilot === null){
					ship.pilot = player;
					ship.score._text = "Player "+player.id;
					ship.visible = ship.sprite.visible = ship.score.visible = true;

					// Assigning ship to ME!?!
					if(player.id === serverData.me.id){
						serverData.me.ship = ship;
					}
					break;

				// Ship is taken by current player
				} else if(ship.pilot.id === player.id){
					break;
				}
			}
		}

		if(serverData.me.isHost && lobbyPlayersLength === serverData.lobby.minPlayers){
			connection.send('gameState','prepare',null,function(defaults){
				this.sendUpdates();
				connection.send('gameState','start');
			}.bind(this));
		}
	}

	Game.prototype.applyKeys = function() {
		if(!has(serverData.me.ship)){ return; }

		var myData = serverData.me.ship,
			myShip = serverData.me.ship.sprite;

		if (gameData.keys.up.isDown){
			this.game.physics.arcade.accelerationFromRotation(myShip.rotation - config.playerSprites.rotationOffset, 300, myShip.body.acceleration);
			myShip.frame = myData.spriteFrames.on;
		} else {
			myShip.frame = myData.spriteFrames.off;
			myShip.body.acceleration.set(0);
		}

		if (gameData.keys.left.isDown){
			myShip.body.angularVelocity = -300;
		} else if (gameData.keys.right.isDown){
			myShip.body.angularVelocity = 300;
		} else {
			myShip.body.angularVelocity = 0;
		}

		if(this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)){
			if(this.game.time.now > nextBullet){
				this.createBullet(myData);
			}
		}
	};

	Game.prototype.createBullet = function(ship, entityData) {
		var bullets = ship.bullets,
			bullet = bullets.getFirstExists(false);

		if(has(entityData)){
			// If this is a new bullet from me. Ignore.
			if(ship.pilot.id === serverData.me.id){
				return;
			}

			// Check to ensure this bullet doesn't exist yet
			if(has(entityData.serverId) && has(livingBullets[entityData.serverId])){
				return;
			}
		}

		if(bullet){
			bullet.events.onKilled.removeAll();

			if(has(entityData)){
				bullet.lifespan = entityData.lifespan;

				bullet.reset(entityData.pos.x, entityData.pos.y).anchor.setTo(0.5,0.5);
				
				bullet.body.velocity.x = entityData.vel.x;
				bullet.body.velocity.y = entityData.vel.y;
				
				bullet.angle = entityData.ang;

				bullet.serverId = entityData.serverId;

				livingBullets[entityData.serverId] = true;

				bullet.events.onKilled.add(function(bulletId){
					delete livingBullets[bulletId];
				}.bind(this,entityData.serverId));

			} else {
				bullet.lifespan = 2000;

				// Positoin
				bullet.reset(ship.sprite.body.x + ship.sprite.body.width / 2, ship.sprite.body.y + ship.sprite.body.height / 2);

				// Angle
				bullet.angle = ship.sprite.angle;

				// Velocity
				this.game.physics.arcade.velocityFromRotation(ship.sprite.rotation - config.playerSprites.rotationOffset, 400, bullet.body.velocity);
				bullet.body.velocity.add(ship.sprite.body.velocity.x,ship.sprite.body.velocity.y);

				nextBullet = this.game.time.now + bulletWait;

				// Tell the server about it
				if(serverData.game.meta.state === 'playing'){
					var bulletId = serverData.me.id + '-' + entityCounter++,
						bulletData = {
							serverId: bulletId,
							type: 'bullet',
							pos: { x: bullet.body.position.x, y: bullet.body.position.y },
							vel: { x: bullet.body.velocity.x, y: bullet.body.velocity.y },
							ang: bullet.angle,
							lifespan: bullet.lifespan
						};

					livingBullets[bulletId] = true;
					bullet.serverId = bulletId;

					connection.send('game','createEntity',bulletData,null,function(err){
						console.log(err);
					});

					bullet.events.onKilled.add(function(bulletId){
						connection.send('game','destroyEntity',{ serverId: bulletId });
						delete livingBullets[bulletId];
					}.bind(this,bulletId),this);
				}
			}

		}
	};

	Game.prototype.update = function() {
		var isPlaying = (serverData.game.meta.state === 'playing');

		if(isPlaying){
			this.applyUpdates();
		}

		this.applyKeys();

		// Loop through ships
		for (var i = 0, l = gameData.playerColours.length; i < l; i++) {
			var colour = gameData.playerColours[i],
				ship = gameData.ships[colour];

			ship.bullets.forEachExists(screenWrap, this, this.game);
		}
		screenWrap(serverData.me.ship.sprite, this.game);		

		if(isPlaying){
			this.sendUpdates();
		}
	};

	Game.prototype.applyUpdates = function() {
		var playerData = serverData.game.players;
		if(playerData){
			// Loop through ships
			for (var i = 0, l = gameData.playerColours.length; i < l; i++) {
				var colour = gameData.playerColours[i],
					ship = gameData.ships[colour];
				
				// If this ship isn't in use then quit looping.
				if(ship.pilot === null || ship.pilot.id === serverData.me.id){ continue; }

				if(has(playerData[ship.pilot.id])){
					// Get things
					var newData = playerData[ship.pilot.id];
					var spriteBody = ship.sprite.body;

					// Update positions
					spriteBody.position.x = newData.pos.x;
					spriteBody.position.y = newData.pos.y;

					// Update velocities
					spriteBody.velocity.x = newData.vel.x;
					spriteBody.velocity.y = newData.vel.y;

					// Update rotations
					spriteBody.rotation = newData.rot;
				}
			}
		}

		var entityData = serverData.game.entities;
		if(entityData){
			// Loop through entities
			var entityNames = Object.keys(entityData);
			for (var i = 0, l = entityNames.length; i < l; i++) {
				var entity = entityData[entityNames[i]], playerTarget;

				if(has(entity)){
					playerTarget = entity.createdByPlayerId
				} else {
					console.log(entity, entityNames, entityNames[i]);
				}

				// Loop through ships
				for (var j = 0, colLength = gameData.playerColours.length; j< colLength; j++) {
					var colour = gameData.playerColours[j],
						ship = gameData.ships[colour];
					
					if(ship.pilot === null || ship.pilot.id !== playerTarget){ continue; }

					this.createBullet(ship, entity);

					break;
				}
			}
		}
	};

	Game.prototype.sendUpdates = function() {
		var data = { players: {} },
			myShipBody = serverData.me.ship.sprite.body;

		data.players[serverData.me.id] = {
			pos:{ x: myShipBody.position.x, y: myShipBody.position.y },
			vel:{ x: myShipBody.velocity.x, y: myShipBody.velocity.y },
			rot: myShipBody.rotation
		};

		data.entities = {};
		serverData.me.ship.bullets.forEachAlive(function(bullet){
			data.entities[bullet.serverId] = {
				pos:{ x: bullet.body.position.x, y: bullet.body.position.y },
				vel:{ x: bullet.body.velocity.x, y: bullet.body.velocity.y },
				ang: bullet.angle,
				lifespan: bullet.lifespan
			}
		}, this);

		connection.send('game','update', data);
	};

	return Game;
})();