"use strict";

if (typeof window.maps === "undefined") {
	window.maps = { };
}
if (typeof window.maps.turtle === "undefined") {
	window.maps.turtle = function() {
		var map = [ ];

		var addTile = function(x, y, z, w, h) {
			map.push({
				x: x || 0,
				y: y || 0,
				z: z || 0,
				w: w || 1,
				h: h || 1
			});
		};

		for (var i =   1; i <=  12; i++) addTile(i -  0, 0);												// First row, 12 tiles
		for (var i =  13; i <=  20; i++) addTile(i - 10, 1);												// Second row, 8 tiles
		for (var i =  21; i <=  30; i++) addTile(i - 19, 2);												// Third row, 10 tiles
		addTile(0, 3.5);																					// First tile on the left (the head)
		for (var i =  32; i <=  43; i++) addTile(i - 31, 3);												// Fourth row, 12 tiles
		for (var i =  44; i <=  55; i++) addTile(i - 43, 4);												// Fifth row, 12 tiles
		addTile(13, 3.5);																					// First tile on the right (the tail)
		addTile(14, 3.5);																					// Last tile on the right (the tip of the tail)
		for (var i =  58; i <=  67; i++) addTile(i - 56, 5);												// Sixth row, 10 tiles
		for (var i =  68; i <=  75; i++) addTile(i - 65, 6);												// Seventh row, 8 tiles
		for (var i =  76; i <=  87; i++) addTile(i - 75, 7);												// Eighth row, 12 tiles
		for (var i =  88; i <= 123; i++) addTile(4 + (i -  88) % 6, 1 + Math.floor((i -  88) / 6), 1);		// Second floor, 36 tiles
		for (var i = 124; i <= 139; i++) addTile(5 + (i - 124) % 4, 2 + Math.floor((i - 124) / 4), 2);		// Third floor, 16 tiles
		for (var i = 140; i <= 143; i++) addTile(6 + (i - 140) % 2, 3 + Math.floor((i - 140) / 2), 3);		// Fourth floor, 4 tiles
		addTile(6.5, 3.5, 4);																				// The top tile

		return map;
	};

	window.maps.turtle.displayName = "Tartaruga";
}
