// Disconnected
var Disconnected = (function(){
	function Dis(game){}
	Dis.prototype.create = function() {
		this.game.add.tileSprite(0, 0, config.size.w, config.size.h, 'background');

		this.game.time.events.add(Phaser.Timer.SECOND * 2, function(){
	    	this.add.text(config.hsize.w, config.hsize.h - 30, "Disconnected", config.text.scaryError).anchor.setTo(0.5, 0.5);
		}, this).autoDestroy = true;
	};
	return Dis;
})();