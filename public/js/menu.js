// Menu
var Menu = (function(){
	function Menu(Menu){}
	Menu.prototype.preload = function() {};
	Menu.prototype.create = function() {
		this.game.add.tileSprite(0, 0, config.size.w, config.size.h, 'background');
		this.game.add.sprite(180, 70, 'title');

		// Ensure you're not in a lobby
		gameData.lobbyData = null;
		connection.send('lobby','leave');

		// Make some buttons for available lobby types
		var lobbyLength = gameData.lobbyTypes.length;

		if(lobbyLength > 0){
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
	return Menu;
})();