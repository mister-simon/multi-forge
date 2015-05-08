module.exports = {
	// Default entity data
	defaults: {
		players:{
			custom:{ score:0, isDead: false },
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
		host: ["asteroid-large", "asteroid-small"]
	},

	// Game rules
	rules: {
		guestsSoftDeleteEntities: false,
		bullet:{
			maxPerPlayer: 50,
			minCreateDelay: 300,
			maxVel:  { x:10, y:10 }
		}
	}
};