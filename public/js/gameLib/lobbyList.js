var LobbyList = (function(){
	function LL(lobbyList, leaveBtn, conn){
		this.ul = lobbyList;
		this.leaveBtn = leaveBtn;
		this.conn = conn;

		this.showLeave(false);

		// Bind buttons
		lobbyList.addEventListener('click',this.callJoin.bind(this));
		leaveBtn.addEventListener('click',this.callLeave.bind(this));

		// Bind connection's events
		var events = [ 'getLobbies', 'lobbyJoin', 'lobbyLeave' ];
		for (var i = 0; i < events.length; i++) {
			var evt = events[i];
			if(has(this[evt])){
				this.conn.on(evt,this[evt].bind(this));
			}
		};
	}

	// Event bound
	LL.prototype.getLobbies = function(data){
		this.showLeave(false);
		this.update(data);
	};
	LL.prototype.lobbyJoin = function(){
		this.showLeave(true);
	};
	LL.prototype.lobbyLeave	 = function(){
		this.showLeave(false);
	};

	// Helpers
	LL.prototype.showLeave = function(show){
		if(show){
			this.leaveBtn.className = "btn";
			this.ul.className = "hidden";
		} else {
			this.leaveBtn.className = "hidden";
			this.ul.className = "";
		}
	};

	LL.prototype.update = function(lobbiesObj){
		/* Expects: { "random": "lobby/random/join", ... } */	 

		// Reset
		this.ul.innerHTML = "";

		// Create a list of lobby types.
		for(var i in lobbiesObj){
			var joinAddress = lobbiesObj[i],
				lobbyLI = document.createElement('LI');

			lobbyLI.textContent = i;
			lobbyLI.className = "btn";
			lobbyLI.setAttribute('data-route',joinAddress);
			this.ul.appendChild(lobbyLI);
		}
	};


	// Click events
	LL.prototype.callJoin = function(event) {
		// event.preventDefault();
		var target = event.target;

		if(target.nodeName === 'LI'){
			var route = target.getAttribute('data-route');
			if(route) this.conn.callAPI(route);
		}
	};

	LL.prototype.callLeave = function(event) {
		this.conn.callAPI('lobby/leave');
	};

	return LL;
})();