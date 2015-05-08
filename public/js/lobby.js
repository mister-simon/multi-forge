// Lobby
var Lobby = (function(){
	function Lobby(game){}

	Lobby.prototype.create = function() {
	    this.createUI();
	    this.trackUpdates();
	};

	Lobby.prototype.createUI = function(){
		// Add background
		this.game.add.tileSprite(0, 0, config.size.w, config.size.h, 'background');

		// Add a title
		this.status = "Lobby Players:";
		this.title = this.add.text(config.hsize.w, (config.hsize.h / 4), this.status, config.text.title);
		this.title.anchor.setTo(0.5, 0.5);

		// Add a subtitle
		this.subtitle = this.add.text(config.hsize.w, (config.hsize.h / 2), "", config.text.subtitle);
		this.subtitle.anchor.setTo(0.5, 0.5);
		this.updateSubtitle();

		addBackBtn(this.game);
	};

	Lobby.prototype.trackUpdates = function(){
		// Bind player / state change updates
		this.bindUpdateListeners();

		// Track players
		this.playersText = Array();
		this.onUpdatePlayerList(serverData.lobby.players);

		// Track game state
		this.onStateUpdated(serverData.game.meta.state);
	};

	Lobby.prototype.bindUpdateListeners = function(){
		serverData.on('lobby.playersUpdate', this.onUpdatePlayerList.bind(this));
		serverData.on('gameState.update', this.onStateUpdated.bind(this));
	};

	Lobby.prototype.unbindUpdateListeners = function(){
		serverData.removeAllListeners('lobby.playersUpdate');
		serverData.removeAllListeners('gameState.update');

		this.game.state.start('game'); 
	};




	Lobby.prototype.onUpdatePlayerList = function(playerList){
		this.updateSubtitle();

		var counter = 0;

		// Prepare for updates.
		for (var i = 0; i < this.playersText.length; i++) {
			this.playersText[i].destroy();
		}

		// Render everything out afresh
		for(var p in playerList){
			var cur = playerList[p];

			var style = (cur.status === 'active' ? config.text.menuHover : config.text.menuSelected);

			var text = this.add.text(config.hsize.w, (config.hsize.h / 1.15) + (100 * counter++), 'Player ' + cur.id, style);
			text.anchor.setTo(0.5, 0.5);

			this.playersText.push(text);
		}

		if(serverData.game.meta.state === 'lobby'){
			this.checkCapacity(counter);
		}
	};

	Lobby.prototype.updateSubtitle = function(){
		var status = Object.keys(serverData.lobby.players).length + " / " + serverData.lobby.minPlayers;
		this.subtitle.setText(status);
	};


	Lobby.prototype.checkCapacity = function(counter){
		if(counter >= serverData.lobby.minPlayers){
			serverData.nextState();
		}
	};

	Lobby.prototype.prepareGameState = function(){
		var centreOffset = 200,
			maxVelocity = 140,
			maxAngularVelocity = 200;
			
		for(var i=0, l=8; i<l; i++){
			var entity = {
				type:'asteroid-'+(Math.random() > 0.7?'small':'large'),
				pos:{
					x: config.hsize.w + ((Math.random() * (centreOffset * 2)) - centreOffset),
					y: config.hsize.h + ((Math.random() * (centreOffset * 2)) - centreOffset)
				},
				vel:{
					x: (Math.random() * (maxVelocity * 2)) - maxVelocity,
					y: (Math.random() * (maxVelocity * 2)) - maxVelocity
				},
				rot: Math.random() * 360,
				av: (Math.random() * (maxAngularVelocity * 2)) - maxAngularVelocity
			};

			entity = serverData.createEntity(entity);
		}
	};

	Lobby.prototype.onStateUpdated = function(newState){
		if(newState === 'preparing'){
			if(serverData.me.isHost){
				this.prepareGameState();				
			}
			this.unbindUpdateListeners();
		}
	};


	return Lobby;
})();