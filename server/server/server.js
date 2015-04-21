function Server(root,config){
	// Set server configs
	this.config = config;
	this.config.port = (process.env.PORT || config.port);

	// Initialise server
	var express = require('express'),
		app = express(),
		http = require('http').Server(app),
		socket = require('socket.io');

	this.io = socket(http);

	// Set server configs
	app.set('port', this.config.port);
	app.use(express.static(root + '/' + config.publicFolder));

	// Listen to http requests
	http.listen(this.config.port, function(){
		console.log("Server listening on port: "+this.config.port);
	}.bind(this));

	return this;
}

module.exports = Server;