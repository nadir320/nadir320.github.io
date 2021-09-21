(function() {
	var _numbers = {
		"-1000000000": "Miliardi",
		"-1000000": "Milioni",
		"-1000": "Mila",
		"-": "Meno",
		"+": "di",
		0: "Zero",
		1: "Uno",
		2: "Due",
		3: "Tre",
		4: "Quattro",
		5: "Cinque",
		6: "Sei",
		7: "Sette",
		8: "Otto",
		9: "Nove",
		10: "Dieci",
		11: "Undici",
		12: "Dodici",
		13: "Tredici",
		14: "Quattordici",
		15: "Quindici",
		16: "Sedici",
		17: "Diciassette",
		18: "Diciotto",
		19: "Diciannove",
		20: "Venti",
		30: "Trenta",
		40: "Quaranta",
		50: "Cinquanta",
		60: "Sessanta",
		70: "Settanta",
		80: "Ottanta",
		90: "Novanta",
		100: "Cento",
		1000: "Mille",
		1000000: "Milione",
		1000000000: "Miliardo",
	};

	var _ordinals = {
		"~10": "Decimo",
		"-": "esimo",
		1: "Primo",
		2: "Secondo",
		3: "Terzo",
		4: "Quarto",
		5: "Quinto",
		6: "Sesto",
		7: "Settimo",
		8: "Ottavo",
		9: "Nono"
	};

	var _count = function(n, a) {
		var c, f, p = "", s = "";

		if (n < 0) {
			p = _numbers["-"] + " ";
			n = -n;
		}
		if (n < 1000000 && _numbers[n]) {
			s = _numbers[n];
		} else {
			if (n >= 1000000000) {
				f = Math.floor(n / 1000000000);
				c = _count(f);
				if ((f % 10) == 1) {
					c = c.substr(0, c.length - 1);
				}
				if (f >= 1000000) {
					c += " " + _numbers["+"];
				}
				c += " " + ((f > 1) ? _numbers[-1000000000] :
					_numbers[1000000000]);
				if (n % 1000000000) {
					c += " ";
				}
				s += c;
				n = n % 1000000000;
			}

			if (n >= 1000000) {
				f = Math.floor(n / 1000000);
				c = _count(f);
				if ((f % 10) == 1) {
					c = c.substr(0, c.length - 1);
				}
				c += " " + ((f > 1) ? _numbers[-1000000] :
					_numbers[1000000]);
				if (n % 1000000) {
					c += " ";
				}
				s += c;
				n = n % 1000000;
			}

			if (n >= 1000) {
				f = Math.floor(n / 1000);
				c = (f > 1) ? _count(f) : _numbers[1000];
				if (f > 1 && (f % 10) == 1) {
					c = c.substr(0, c.length - 1);
				}
				if (f > 1) {
					c += _numbers[-1000];
				}
				if (!a && n % 1000 != 0) {
					c += " ";
				}
				s += c;
				n = n % 1000;
			}

			if (n >= 100) {
				c = "";
				f = Math.floor(n / 100);

				if (f > 1) {
					c = _numbers[f];
				}
				c += _numbers[100];
				s += c;
				n = n % 100;
			}

			if (n) {
				if (_numbers[n]) {
					c = _numbers[n];
				} else {
					c = _numbers[Math.floor(n / 10) * 10];
					if (n % 10 == 1 || n % 10 == 8) {
						c = c.substr(0, c.length - 1);
					}
					if (n % 10) {
						c += _numbers[n % 10];
					}
				}
				s += c;
			}
		}
		if (p.length) {
			s = p + s;
		}
		return s[0].toUpperCase() + s.substr(1).toLowerCase();
	};

	window.contatore = function() {
		return {
			"toOrdinalString": function(number, noSpaces) {
				var d, e = true, n, r = true, s = _ordinals[number], u;

				if (!s) {
					n = Math.abs(number);

					u = n % 10;
					d = ((n - u) / 10) % 10;

					if (d != 1) {
						switch (u) {
							case 3:
							case 6:
								r = false;
								break;
						}
					}

					s = _count(number, noSpaces);
					if (r) {
						if (d === 1 && u === 0) {
							s = s.substring(s, s.length - _numbers[10].length);
							s += _ordinals["~10"];
							e = false;
						} else {
							s = s.substring(0, s.length - 1);
						}
					}
					if (e) {
						s += _ordinals["-"];
					}
				}
				return s[0].toUpperCase() + s.substr(1).toLowerCase();
			},
			"toString": function(number, noSpaces) {
				return _count(number, noSpaces);
			}
		};
	};
})();
