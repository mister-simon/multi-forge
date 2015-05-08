function screenWrap(sprite, game) {
    if (sprite.x < 0){
        sprite.x = game.width;
    } else if (sprite.x > game.width){
        sprite.x = 0;
    }
    
    if (sprite.y < 0){
        sprite.y = game.height;
    } else if (sprite.y > game.height){
        sprite.y = 0;
    }
}

function objectLength(obj){
	return Object.keys(obj).length;
}

function addBackBtn(game){
	// Add a back button
	var backBtn = game.add.sprite(0, 0, 'menu');
	backBtn.inputEnabled = true;
	
	// Make it clickable
	backBtn.events.onInputDown.add(function(){
		serverData.leaveLobby(function(){
			var current = game.state.current,
				curState = game.state.states[current];

			if(has(curState.unbindUpdateListeners)){
				curState.unbindUpdateListeners();
			}

			serverData.leaveLobby();

			game.state.start('menu');
		}.bind(this))
	},this);
}