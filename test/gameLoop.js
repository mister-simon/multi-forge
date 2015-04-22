'use strict';
var assert = require('assert');
var looper = require('../server/game/looper');
var should = require('should');

describe('Game Loop module', function () {
	this.timeout(4000);

	it('should reach 4 ticks after 3 seconds at 1hz', function (done) {
		var start = Date.now();
		new looper(function(ticks){
			if(ticks === 4){
				var diff = Date.now() - start;
				diff.should.be.approximately(3000,16.6);

				this.stop();
				done();
			}
		},1000).play();
	});

	it('should not play until told to (no play)', function (done) {
		var loop = new looper(function(/*ticks*/){},1000);
		setTimeout(function(){
			loop.playing.should.be.false;

			loop.stop();
			done();
		},1000);
	});

	it('should not play until told to (play)', function (done) {
		var loop = new looper(function(/*ticks*/){},1000).play();
		setTimeout(function(){
			loop.playing.should.be.true;

			loop.stop();
			done();
		},1000);
	});

	it('should not play until told to (play then stop)', function (done) {
		var loop = new looper(function(/*ticks*/){},1000).play();

		setTimeout(function(){
			loop.stop();
			setTimeout(function(){
				loop.playing.should.be.false;
				done();
			},500);
		},500);

	});
});
