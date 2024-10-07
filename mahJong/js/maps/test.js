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

		/* addTile({i: 0});
		addTile({z: 1, i: 0});
		addTile({z: 2, i: 0});

		addTile({      y: 2, i: 0}); */

		addTile({i:  0, x: 0, y: 0});
		addTile({i:  0, x: 1, y: 0});
		addTile({i:  0, x: 2, y: 0});
		addTile({i:  0, x: 3, y: 0});

		addTile({i:  4, x: 0, y: 1});
		addTile({i:  8, x: 1, y: 1});
		addTile({i:  4, x: 2, y: 1});
		addTile({i:  8, x: 3, y: 1});

		addTile({i:  8, x: 1, y: 1, z: 1});
		addTile({i:  4, x: 2, y: 1, z: 1});

		addTile({i:  4, x: 1, y: 2});
		addTile({i:  8, x: 2, y: 2});

		// ------------------------------

		addTile({i: 24, x: -1, y: 4});
		addTile({i: 12, x: 0, y: 4});
		addTile({i: 12, x: 1, y: 4});
		addTile({i: 12, x: 2, y: 4});
		addTile({i: 12, x: 3, y: 4});
		addTile({i: 24, x: 4, y: 4});

		addTile({i: 24, x: -1, y: 5});
		addTile({i: 16, x: 0, y: 5});
		addTile({i: 20, x: 1, y: 5});
		addTile({i: 16, x: 2, y: 5});
		addTile({i: 20, x: 3, y: 5});
		addTile({i: 24, x: 4, y: 5});

		addTile({i: 16, x: 1, y: 5, z: 1});
		addTile({i: 20, x: 2, y: 5, z: 1});

		addTile({i: 16, x: 1, y: 6});
		addTile({i: 20, x: 2, y: 6});

		// ------------------------------

		addTile({i: 28, x: 1, y: 8});
		addTile({i: 28, x: 2, y: 8});

		addTile({i: 36, x: 0, y: 9});
		addTile({i: 36, x: 1, y: 9});
		addTile({i: 32, x: 2, y: 9});
		addTile({i: 28, x: 3, y: 9});

		addTile({i: 32, x: 1, y: 9, z: 1});
		addTile({i: 28, x: 2, y: 9, z: 1});

		addTile({i: 32, x: 1, y: 10});
		addTile({i: 32, x: 2, y: 10});
		addTile({i: 36, x: 1, y: 11});
		addTile({i: 36, x: 2, y: 11});

		// ------------------------------

		addTile({i: 40, x: 0, y: 13});
		addTile({i: 40, x: 1, y: 13});
		addTile({i: 40, x: 2, y: 13});
		addTile({i: 40, x: 3, y: 13});

		addTile({i: 44, x: 0, y: 13, z: 1});
		addTile({i: 44, x: 1, y: 13, z: 1});

		addTile({i: 48, x: 1, y: 13, z: 2});
		addTile({i: 52, x: 2, y: 13, z: 1});
		addTile({i: 48, x: 3, y: 13, z: 1});
		addTile({i: 52, x: 4, y: 13});

		addTile({i: 44, x: 1, y: 14});
		addTile({i: 44, x: 2, y: 14});
		addTile({i: 48, x: 1, y: 15});
		addTile({i: 48, x: 2, y: 15});
		addTile({i: 52, x: 1, y: 16});
		addTile({i: 52, x: 2, y: 16});

		// ------------------------------

		addTile({i: 56, x: 10, y: 0});
		addTile({i: 56, x: 11, y: 0});
		addTile({i: 60, x: 12, y: 0});
		addTile({i: 64, x: 13, y: 0});
		addTile({i: 60, x: 13, y: 0, z: 1});

		addTile({i: 56, x: 10, y: 2});
		addTile({i: 56, x: 11, y: 2});
		addTile({i: 60, x: 10, y: 3});
		addTile({i: 60, x: 11, y: 3});
		addTile({i: 64, x: 10, y: 4});
		addTile({i: 64, x: 11, y: 4});
		addTile({i: 64, x: 12, y: 4});

		// ------------------------------

		addTile({i: 68, x: 10, y: 6});
		addTile({i: 72, x: 10, y: 6, z: 1});
		addTile({i: 72, x: 11, y: 6});
		addTile({i: 76, x: 12, y: 6});
		addTile({i: 68, x: 13, y: 6});
		addTile({i: 76, x: 13, y: 6, z: 1});

		addTile({i: 68, x: 10, y: 8});
		addTile({i: 68, x: 11, y: 8});
		addTile({i: 72, x: 10, y: 9});
		addTile({i: 72, x: 11, y: 9});
		addTile({i: 76, x: 10, y: 10});
		addTile({i: 76, x: 11, y: 10});

		/*addTile({      y: 3, i: 0});
		addTile({x: 1, y: 3, i: 0});
		addTile({      y: 4, i: 0});
		addTile({x: 1, y: 4, i: 0});*/

		return map;
	};

	window.maps.test.displayName = "Test";
}