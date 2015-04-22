module.exports = (function(){
    function Looper(step, refreshRate){
        this.step = step;
        this.refreshRate = (typeof refreshRate !== 'undefined') ? refreshRate : 1000 / 60; //60FPS (16.66)
        this.last = this.ticks = 0;

        this.playing = false;
    }

    Looper.prototype.stop = function(){
        // console.log("Stopping loop!");
        this.playing = false;
        return this;
    };

    Looper.prototype.start =
    Looper.prototype.play = function(){
        // console.log("Starting loop!");
        this.playing = true;
        this.last = Date.now()-this.refreshRate;
        this.loop();
        return this;
    };

    Looper.prototype.loop = function(){
        if(this.playing === false){ return; }

        var cur = Date.now(),
            diff = cur - this.last;

        if(diff >= this.refreshRate) {
            this.ticks++;
            this.step(this.ticks);
            this.last = cur;
            setImmediate(this.loop.bind(this));
        } else {
            setTimeout(this.loop.bind(this));
        }
    };

    return Looper;
})();