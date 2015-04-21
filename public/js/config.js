var config = {
	name: 'Fasteroids',
	subname: 'Multi-Forge-Asteroids',
	size:{
		w:1000,
		h:700
	},
	colours: {
		// Text
		'green-prime'	:'#00CA00',
		'green-second'	:'#009900',
		'grey'			:'#323532',

		// Players
		'red'			:'#990000',
		'orange'		:'#FF6600',
		'purple'		:'#6633FF',
		'pink'			:'#FF33FF'
	},
	font:'Pixelated',
	playerSprites:{
		colours:{
			red:{ off:0, on:1 },
			orange:{ off:2, on:3 },
			purple:{ off:4, on:5 },
			pink:{ off:6, on:7 }
		}
	}
};

var spriteSize = 47;
config.playerSprites.startPos = {
	red: 	{ x: spriteSize,					y: spriteSize,					r: Phaser.Math.degToRad(180)		},
	orange: { x: config.size.w - spriteSize, 	y: spriteSize, 					r: Phaser.Math.degToRad(270)			},
	purple: { x: config.size.w - spriteSize, 	y: config.size.h - spriteSize,	r: Phaser.Math.degToRad(0)			},
	pink: 	{ x: spriteSize, 					y: config.size.h - spriteSize,	r: Phaser.Math.degToRad(90)		},
};

config.playerSprites.scorePos = {
	red: 	{ x: 0,					y: 0,						ax: 0, 		ay: 0 },
	orange: { x: config.size.w, 	y: 0,						ax: 1, 		ay: 0 },
	purple: { x: config.size.w, 	y: config.size.h,			ax: 1, 		ay: 1 },
	pink: 	{ x: 0, 				y: config.size.h,			ax: 0, 		ay: 1 },
};

config.text = {
	// Various styles
	title: {
		font: "32px "+config.font,
		fill: config.colours['green-prime']
	},
	scaryError: {
		font: "50px "+config.font,
		fill: config.colours['red']
	},
	subtitle: {
		font: "25px "+config.font,
		fill: config.colours['green-second']
	},
	menu: {
		font: "75px "+config.font,
		fill: config.colours['grey']
	},
	menuHover: {
		font: "75px "+config.font,
		fill: config.colours['green-prime']
	},
	menuSelected: {
		font: "75px "+config.font,
		fill: config.colours['red']
	},

	// Settings for user scores
	'score-red':{
		font: "30px "+config.font,
		fill: config.colours['red']
	},
	'score-orange':{
		font: "30px "+config.font,
		fill: config.colours['orange']
	},
	'score-pink':{
		font: "30px "+config.font,
		fill: config.colours['pink']
	},
	'score-purple':{
		font: "30px "+config.font,
		fill: config.colours['purple']
	}
};

config.hsize = {
	w: config.size.w / 2,
	h: config.size.h / 2
};