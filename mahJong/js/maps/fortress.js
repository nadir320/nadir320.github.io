"use strict";

if (typeof window.maps === "undefined") {
	window.maps = { };
}
if (typeof window.maps.fortress === "undefined") {
	window.maps.fortress = function() {
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

		var row = function(y, z, values) {
			for (var i = 0; i < values.length; i++) {
				addTile(values[i], y, z);
			}
		};

		var row0 = function(y) {
			row(y, 0, [0, 1, 2, 4.5, 7, 8, 10.5, 13, 14, 15]);
			row(y, 1, [2.5, 4.5, 6.5, 7.5, 8.5, 10.5, 12.5]);
			row(y, 2, [3, 4.5, 6, 7, 8, 9, 10.5, 12]);
			row(y, 3, [3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5]);
			row(y, 4, [4, 5, 10, 11]);
		};

		var row1 = function(y) {
			row(y, 0, [1, 7, 8, 14]);
			row(y, 1, [6.5, 7.5, 8.5]);
			row(y, 2, [6, 9]);
			row(y, 3, [5.5, 9.5]);
			row(y, 4, [5, 10]);
		};

		row0(0);
		row1(1);
		row1(2);
		row1(3);
		row1(4);
		row0(5);

		row(1.5, 0, [2, 13]);
		row(2.5, 0, [2, 3, 12, 13]);
		row(2.5, 1, [1, 2, 13, 14]);
		row(2.5, 2, [1, 7, 8, 14]);
		row(3.5, 0, [2, 13]);

		map.sort(function(a, b) {
			var o = function(x) {
				if (!x.offset && x.x >= 10.5 && x.z < 4) {
					x.x += 0.5;
					x.offset = true;
				}
			};

			o(a);
			o(b);
			return (a.z * 10000 + a.x * 100 + a.y) - (b.z * 10000 + b.x * 100 + b.y);
		});
		return map;
	};

	window.maps.fortress.displayName = "Fortezza";
}
