// Game
var Game = (function(){
	function Game(game){}

	// ---------------------------------
	// 		Initialisation
	// ---------------------------------

	var nextBullet = 0,
		bulletWait = 250,
		livingBullets = [],
		livingAsteroids = [];

	Game.prototype.create = function() {
		this.startingIn = 2;
		
		nextBullet = 0;
		livingBullets = [];
		livingAsteroids = [];

		this.gameEnded = false;
		this.createData();
	    this.createUI();
	};

	Game.prototype.createUI = function(){
	    // Add background
		this.game.add.tileSprite(0, 0, config.size.w, config.size.h, 'background');

    	// Reset players
    	this.resetPlayers();    	

    	// Create a nice overlay + countdown
		this.overlay = this.game.add.tileSprite(0, 0, config.size.w, config.size.h, 'overlay');
		this.countDown = this.add.text(config.hsize.w, config.hsize.h, this.startingIn + 1, config.text.title);
		this.countDown.anchor.set(0.5, 0.5);
	};

	Game.prototype.createData = function(){
		// Reset all the game data
		gameData = { me:{} };
		this.asteroids = [];
    	
		// Start physics engine
    	this.game.physics.startSystem(Phaser.Physics.ARCADE);

		// Bind listeners
		this.bindUpdateListeners();

		// Track game state
		this.onStateUpdated(serverData.game.meta.state);


    	// Capture inputs
	    this.keys = this.game.input.keyboard.createCursorKeys();
	    this.game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
	};

	Game.prototype.bindUpdateListeners = function(){
		serverData.on('gameState.update', this.onStateUpdated.bind(this));
	};

	Game.prototype.unbindUpdateListeners = function(){
		serverData.removeAllListeners('gameState.update');
	};

	Game.prototype.onStateUpdated = function(newState){
		if(newState === 'preparing'){
			this.decrementCountdown();

		} else if(newState === 'playing') {
			this.resetScores();

		} else if(newState === 'stopped'){
			this.unbindUpdateListeners();
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
	};

	Game.prototype.resetScores = function(){
		/*// Refresh all player game data
		for(var i in gameData.ships){
			var ship = gameData.ships[i];
			ship.score.setText(0);
		}*/
	};

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
	};

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
					ship.score.setText("Player "+player.id);
					ship.visible = ship.sprite.visible = ship.score.visible = true;

					// Assigning ship to ME!?!
					if(player.id === serverData.me.id){
						gameData.me.ship = ship;
					}
					break;

				// Ship is taken by current player
				} else if(ship.pilot.id === player.id){
					break;
				}
			}
		}
	};


	// ---------------------------------
	// 		Frame updates
	// ---------------------------------

	Game.prototype.update = function() {
		var isPlaying = (serverData.game.meta.state === 'playing');

		if(isPlaying){
			this.applyPlayerUpdates();
			this.applyEntityUpdates();
		}

		this.applyKeys();

		// Loop through ships
		for (var i = 0, l = gameData.playerColours.length; i < l; i++) {
			var ship = gameData.ships[gameData.playerColours[i]];
			ship.bullets.forEachExists(screenWrap, this, this.game);
		}		
		screenWrap(gameData.me.ship.sprite, this.game);

		// Screenwrap asteroids too
		for (var i = 0, l = this.asteroids.length; i < l; i++) {
			var asteroid = this.asteroids[i];
			screenWrap(asteroid, this.game);
		}

		if(isPlaying && !this.gameEnded){
			this.checkCollisions();
			this.sendUpdates();

			this.isEverybodyDeadOrSomething();
		}
	};

	Game.prototype.applyKeys = function() {
		if(!has(gameData.me.ship)){ return; }

		var myData = gameData.me.ship,
			myShip = gameData.me.ship.sprite;

		if(!myShip.alive){ return; }

		if (this.keys.up.isDown){
			this.game.physics.arcade.accelerationFromRotation(myShip.rotation - config.playerSprites.rotationOffset, 300, myShip.body.acceleration);
			myShip.frame = myData.spriteFrames.on;
		} else {
			myShip.frame = myData.spriteFrames.off;
			myShip.body.acceleration.set(0);
		}

		if (this.keys.left.isDown){
			myShip.body.angularVelocity = -300;
		} else if (this.keys.right.isDown){
			myShip.body.angularVelocity = 300;
		} else {
			myShip.body.angularVelocity = 0;
		}

		if(this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) && this.game.time.now > nextBullet){
			this.createBullet(myData);
		}
	};

	Game.prototype.applyPlayerUpdates = function(){
		var playerData = serverData.game.players;
		if(playerData){
			// Loop through ships
			for (var i = 0, l = gameData.playerColours.length; i < l; i++) {
				var colour = gameData.playerColours[i],
					ship = gameData.ships[colour];
				
				// If this ship isn't in use then quit looping.
				if(ship.pilot === null || !has(playerData[ship.pilot.id])){ continue; }

				var serverPlayer = playerData[ship.pilot.id];

				if(serverPlayer.custom.isDead){
					ship.sprite.kill();
					continue;
				}

				// ship.score.setText(serverPlayer.custom.score);

				if(ship.pilot.id !== serverData.me.id){
					// Get things
					var spriteBody = ship.sprite.body;

					// Update positions
					spriteBody.position.x = serverPlayer.pos.x;
					spriteBody.position.y = serverPlayer.pos.y;

					// Update velocities
					spriteBody.velocity.x = serverPlayer.vel.x;
					spriteBody.velocity.y = serverPlayer.vel.y;

					// Update rotations
					spriteBody.rotation = serverPlayer.rot;
				}
			}
		}
	};

	Game.prototype.applyEntityUpdates = function(){
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

				if(entity.type === 'bullet'){
					// Loop through ships
					for (var j = 0, colLength = gameData.playerColours.length; j < colLength; j++) {
						var colour = gameData.playerColours[j],
							ship = gameData.ships[colour];
						
						if(ship.pilot === null || ship.pilot.id !== playerTarget){ continue; }
						if(serverData.game.players[ship.pilot.id].custom.isDead) { continue; }

						this.createBullet(ship, entity);

						break;
					}
				}

				if(entity.type === 'asteroid-large' || entity.type === 'asteroid-small'){
					this.createAsteroid(entity);
				}
			}
		}
	};

	Game.prototype.sendUpdates = function() {
		var data = { players: {}, entities: {} },
			myShipBody = gameData.me.ship.sprite.body,
			customData = serverData.game.players[serverData.me.id];

		if(!has(customData)){
			customData = { custom: { score:0, isDead: false } };
		}

		data.players[serverData.me.id] = {
			custom: customData.custom,
			pos:{ x: myShipBody.position.x, y: myShipBody.position.y },
			vel:{ x: myShipBody.velocity.x, y: myShipBody.velocity.y },
			rot: myShipBody.rotation
		};

		gameData.me.ship.bullets.forEachAlive(function(bullet){
			data.entities[bullet.serverId] = {
				pos:{ x: bullet.body.position.x, y: bullet.body.position.y },
				vel:{ x: bullet.body.velocity.x, y: bullet.body.velocity.y },
				ang: bullet.angle,
				lifespan: bullet.lifespan
			}
		}, this);

		serverData.gameUpdate(data);
	};

	Game.prototype.createAsteroid = function(entityData) {
		if(livingAsteroids.indexOf(entityData.serverId) === -1){
			var sprite = this.game.add.sprite(entityData.pos.x, entityData.pos.y, entityData.type);
			sprite.anchor.set(0.5);

			this.game.physics.enable(sprite, Phaser.Physics.ARCADE);
			sprite.rotation = entityData.rot;		
			sprite.body.position.add(entityData.pos.x, entityData.pos.y);
			sprite.body.velocity.add(entityData.vel.x, entityData.vel.y);
			sprite.body.angularVelocity = entityData.av;

			livingAsteroids.push(entityData.serverId);
			this.asteroids.push(sprite);
		}
	};

	Game.prototype.createBullet = function(ship, entityData) {
		var bullets = ship.bullets,
			bullet = bullets.getFirstExists(false);

		if(has(entityData)){
			// If this is a new bullet from me. Ignore.
			// Check to ensure this bullet doesn't exist yet
			if(ship.pilot.id === serverData.me.id || has(entityData.serverId) && has(livingBullets[entityData.serverId])){
				return;
			}
		}

		if(bullet){
			bullet.events.onKilled.removeAll();

			if(has(entityData)){
				bullet.lifespan = entityData.lifespan;

				bullet.reset(entityData.pos.x + 9, entityData.pos.y + 9).anchor.setTo(0.5,0.5);
				
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
					var entityData = serverData.createEntity({
						type: 'bullet',
						pos: { x: bullet.body.position.x, y: bullet.body.position.y },
						vel: { x: bullet.body.velocity.x, y: bullet.body.velocity.y },
						ang: bullet.angle,
						lifespan: bullet.lifespan
					});

					livingBullets[entityData.serverId] = true;

					bullet.events.onKilled.add(function(bulletId){
						serverData.destroyEntity(bulletId);
						delete livingBullets[bulletId];
					}.bind(this, entityData.serverId),this);
				}
			}
		}
	};



	// ---------------------------------
	// 		Collisions + stuff
	// ---------------------------------

	Game.prototype.checkCollisions = function(){
		var collided;

		for (var j = 0, la = this.asteroids.length; j < la; j++) {
			var asteroid = this.asteroids[j];

			if(!asteroid.alive){
				continue;
			}

			collided = false;

			for (var i = 0, l = gameData.playerColours.length; i < l; i++) {
				var colour = gameData.playerColours[i],
					ship = gameData.ships[colour];

				if(ship.pilot === null){
					continue;
				}

				
				// Increment scores, explode large asteroids
				this.physics.arcade.overlap(asteroid, ship.bullets, function(hit_asteroid, hit_bullet){

					if(serverData.me.isHost){
						serverData.destroyEntity(asteroid.serverId);

						var players = {},
							player = serverData.game.players[ship.pilot.id];

						player.custom.score += (asteroid.key === 'asteroid-large' ? 100 : 150);

						players[ship.pilot.id] = player;
						serverData.gameUpdate({
							players: players
						});
					}

					hit_bullet.kill();
					asteroid.kill();
					collided = true;
				});

				// Send the server updates
				if(!collided){
					this.physics.arcade.collide(ship.sprite, asteroid, function(){

						if(serverData.me.isHost){
							serverData.destroyEntity(asteroid.serverId);

							var players = {},
								player = serverData.game.players[ship.pilot.id];

							player.custom.isDead = true;

							players[ship.pilot.id] = player;
							serverData.gameUpdate({
								players: players
							});
						}

						asteroid.kill();
						ship.sprite.kill();
						collided = true;
					});
				}
			}
		}
	};


	Game.prototype.isEverybodyDeadOrSomething = function(){
		var yesEveryoneIsDead = true;

		for (var i = 0, l = gameData.playerColours.length; i < l; i++) {
			var colour = gameData.playerColours[i],
				ship = gameData.ships[colour];

			if(ship.pilot === null){
				continue;
			}

			if(ship.sprite.alive){
				yesEveryoneIsDead = false;
				break;
			}
		}

		if(yesEveryoneIsDead){
			this.gameOver();
			return;
		}

		if(this.asteroids.length > 0){
			var allTheAsteroidsDied = true;
			for (var i = 0, l = this.asteroids.length; i < l; i++) {
				if(this.asteroids[i].alive === true){
					allTheAsteroidsDied = false;
					break;
				}
			}

			if(allTheAsteroidsDied){
				this.gameOver();
				return;
			}
		}
	};

	Game.prototype.gameOver = function(){
		this.gameEnded = true;
		serverData.nextState();
	};

	return Game;
})();