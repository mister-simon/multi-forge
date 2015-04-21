module.exports = {
	// Default entity data
	defaults: {
		players:{
			custom:{ score:0 },
			pos:{ x:0, y:0 },
			vel:{ x:0, y:0 },
			rot:0
		}
	},

	// Permissions for spawning entities
	// These entities will be the only ones
	// the server will accept
	entityPermissions: {
		public: ["bullet"],
		host: ["asteroid"]
	},

	// Game rules
	rules: {
		bullet:{
			maxPerPlayer: 50,
			minCreateDelay: 300,
			maxVel:  { x:10, y:10 }
		}
	}
};