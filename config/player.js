// ---------------------------------- 
// Configuration options for players.
// ---------------------------------- 

// Custom: Allows you to create defaults for custom data
// when a Player first connects to the server
var initial = {
	custom: {
		// nickname: "Bob"
	}
};


// // Custom: Allows you to create defaults for custom data
// // when a Player first joins a lobby
// var lobbied = {
// 	custom: {
// 		// winning_streak: 0
// 	}
// };


// // Custom: Allows you to create defaults for custom data
// // when a Player first enters a match
// var gaming = {
// 	custom: {
// 		score: 0,
// 		rotation: 0,
// 		rotationVel: 0
// 	}
// };



module.exports = {
	initial: initial
	// lobbied: lobbied,
	// gaming: gaming
};