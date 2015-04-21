var PlayerList = (function(){
	function PL(playerListUL, connection){
		this.ul = playerListUL;
		this.conn = connection;

		this.yourId = null;
		this.you = null;

		this.initHTML = this.ul.innerHTML;

		// Bind connection's events
		var events = [ 'getLobbies', 'lobbyJoin', 'lobbyLeave', 'lobbyPlayers'];
		for (var i = 0; i < events.length; i++) {
			var evt = events[i];
			if(has(this[evt])){
				this.conn.on(evt,this[evt].bind(this));
			}
		};
	}

	// Events
	PL.prototype.getLobbies = function() {
		this.reset(true);
	};
	PL.prototype.lobbyJoin = function(data) {
		this.yourId = data.yourId;
		this.update(data.players);
	};
	PL.prototype.lobbyLeave = function() {
		this.reset(true);
	};
	PL.prototype.lobbyPlayers = function() {
		this.update(data);
	};

	// Helpers
	PL.prototype.reset = function(useInitHTML) {
		this.ul.innerHTML = useInitHTML?this.initHTML:"";
	};

	PL.prototype.update = function(playersObj) {
		/* Expects:
		playersObj = {
			4:{
				id:4,
				status:"active",
				isHost:true
			}
		}
		*/

		this.reset();

		for(var i in playersObj){
			var player = playersObj[i],
				playerLI = document.createElement('LI');

			// Store details about yourself.
			if(player.id === this.yourId){ this.you = player; }
			playerLI.innerHTML = "Player "+player.id;

			playerLI.className = player.status;
			playerLI.className += (player.id === this.yourId ? " you" : "");
			if(player.isHost) playerLI.className += " host";

			this.ul.appendChild(playerLI);
		}
	};
	
	return PL;
})();