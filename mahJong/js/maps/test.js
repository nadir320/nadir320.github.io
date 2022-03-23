"use strict";

if (typeof window.maps === "undefined") {
	window.maps = { };
}
if (typeof window.maps.test === "undefined") {
	window.maps.test = function() {
		var _, map = [ ];

		var addTile = function(x, y, z, w, h, i) {
			if (arguments.length === 1) {
				y = x.y;
				z = x.z;
				w = x.w;
				h = x.h;
				i = x.i;

				x = x.x;
			}
			map.push({
				faceIndex: i,
				x: x || 0,
				y: y || 0,
				z: z || 0,
				w: w || 1,
				h: h || 1
			});
		};

		var pyramid = function(x, y, size, h, z) {
			var n = size;

			h = h || Math.ceil(size / 2) + 1;
			z = z || 0;

			for (var i = z; i < h + z; i++) {
				for (var j = 0, m = Math.pow(n, 2); j < m; j++) {
					addTile(x + j % n, y + Math.floor(j / n), i);
				}
				if (n === 2 || (n % 2 && n <= 3)) {
					n--;
					x += 0.5;
					y += 0.5;
				} else {
					n -= 2;
					x++;
					y++;
				}
				if (n < 1) {
					break;
				}
			}
		};

		/* pyramid(0, 0, 4); pyramid(5, 0, 4); pyramid(10, 0, 4); pyramid(15, 0, 4);
		pyramid(0, 5, 4); pyramid(5, 5, 4); pyramid(10, 5, 4); pyramid(15, 5, 4); */

		/* {
			addTile(0, 0, 0, 1, 1, 0);
			addTile(0, 0, 1, 1, 1, 0);

			addTile(0, 1, 0, 1, 1, 0);

			addTile(0, 2, 0, 1, 1, 4);
			addTile(1, 2, 0, 1, 1, 0);
			addTile(2, 2, 0, 1, 1, 8);
			addTile(3, 2, 0, 1, 1, 4);
			addTile(4, 2, 0, 1, 1, 8);
		} */

		/* pyramid(0, 5, 3); */
		/* pyramid(0, 9, 3); */
		/* pyramid(5, 7, 5); */

		/* (function() { var b = 0; while (map.length % 4) addTile(-1, -1, b++); })(); */

		addTile({i: 0});
		addTile({z: 1, i: 0});
		addTile({z: 2, i: 0});

		addTile({      y: 2, i: 0});

		addTile({      y: 3, i: 0});
		addTile({x: 1, y: 3, i: 0});
		addTile({      y: 4, i: 0});
		addTile({x: 1, y: 4, i: 0});

		return map;
	};

	window.maps.test.displayName = "Test";
}