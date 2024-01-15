"use strict";

window.Array.prototype.blockSplit = function(length) {
	var block, blocks, i;

	if (length) {
		blocks = [ ];

		for (i = 0; i < this.length; i++) {
			if (!block) {
				block = [ ];
			}
			block.push(this[i]);
			if (block.length >= length) {
				blocks.push(block);
				block = undefined;
			}
		}
		if (block) {
			blocks.push(block);
		}
		return blocks;
	}
	return this;
};

window.Array.prototype.sortBy = function(property, caseSensitive) {
	var args = arguments;

	var compare = function(o) {
		return (o.a < o.b) ? -1 : (o.a > o.b) ? 1 : 0;
	};

	var getProperties = function(a, b, name) {
		a = (typeof name === "function") ?
			name(a) : a[name];
		b = (typeof name === "function") ?
			name(b) : b[name];

		if (typeof a === "string" &&
			typeof b === "string" &&
			!caseSensitive) {

			a = a.toLowerCase();
			b = b.toLowerCase();
		} else {
			if (a instanceof Date) {
				a = a.getTime();
			}
			if (b instanceof Date) {
				b = b.getTime();
			}
		}
		return {
			"a": a,
			"b": b
		};
	};

	this.sort(function(a, b) {
		var i, r;

		if ((r = compare(getProperties(a, b, property))) === 0) {
			for (i = 2; i < args.length; i++) {
				if ((r = compare(getProperties(a, b, args[i]))) !== 0) {
					break;
				}
			}
		}
		return r;
	});
};

window.Math.roundTo = function(number, digits) {
	var i;

	number *= Math.pow(10, digits);
	number = Math.round(number);
	number /= Math.pow(10, digits);
	return number;
};

window.Object.asArray = function() {
	var a = [ ], i, x;

	for (i in this) {
		x = this[i];
		if (typeof x !== "function" &&
			!Array.prototype.hasOwnProperty(i)) {

			a.push(x);
		}
	}
	return a;
};

if (window.RegExp) {
	window.escapeRegExp = window.RegExp.escape = function(pattern) {
		return pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	};
}

window.String.empty = "";

window.String.format = function(format) {
	for (var i = 1; i < arguments.length; i++) {
		format = format.replace(new window.RegExp("\\{" +
			(i - 1).toString() + "\\}", "gi"), arguments[i]);
	}
	return format;
};

window.String.prototype.format = function() {
	var a = argumentsArray(arguments);

	a.splice(0, 0, this);
	return window.String.format.apply(window, a);
};

window.String.prototype.isLowerCase = function() {
	return !this.isNumeric() &&
		(this.toLowerCase() == this);
};

window.String.prototype.isNumeric = function() {
	return !isNaN(this * 0);
}

window.String.prototype.isUpperCase = function() {
	return !this.isNumeric() &&
		(this.toUpperCase() == this);
}

window.String.prototype.padLeft = function(length, paddingChar) {
	var result = this;

	if (!(paddingChar && paddingChar.length)) {
		paddingChar = " ";
	}
	while (result.length < length) {
		result = paddingChar + result;
	};
	return result;
};

window.String.prototype.padRight = function(length, paddingChar) {
	var result = this;

	if (!(paddingChar && paddingChar.length)) {
		paddingChar = " ";
	}
	while (result.length < length) {
		result = result + paddingChar;
	};
	return result;
};

window.String.prototype.splitByCase = function() {
	var part = String.empty,
		parts = [ ],
		newClass,
		oldClass;

	for (var i = 0, c = this[i], length = this.length; i < length; i++, c = this[i]) {
		newClass = (c.isNumeric()) ?
			1 :
			(c.isLowerCase()) ?
				2 :
				(c.isUpperCase()) ?
				3 :
				4;

		if (newClass !== oldClass && part.length) {
			if (!(oldClass === 3 && newClass === 2)) {
				parts.push(part);
				part = String.empty;
			}
		}
		part += c;
		oldClass = newClass;
	}
	if (part.length) {
		parts.push(part);
	}
	return parts;
};

if (window.btoa) {
	window.String.prototype.purify = function() {
		var i, pure = String.empty;

		for (i = 0; i < this.length; i++) {
			try {
				window.btoa(this[i]);
				pure += this[i];
			} catch (e) { /* debugger; */ }
		}
		return pure;
	};

	window.String.prototype.toBase64Data = function() {
		return "data:text/plain;base64," + window.btoa("\xef\xbb\xbf" +
			window.encodeURIComponent(this).replace(/%([0-9A-F]{2})/g,
				function(match, p) {
					return String.fromCharCode(parseInt(p, 16));
				}));
	};
}

window.String.prototype.toTitleCase = function() {
	var parts = this.split(" ");

	for (var i = 0, length = parts.length, part = parts[i]; i < length; i++, part = parts[i]) {
		if (part.length) {
			parts[i] = part[0].toUpperCase() + part.substring(1).toLowerCase();
		}
	}
	return parts.join(" ");
};

if (!window.String.prototype.trim) {
	window.String.prototype.trim = function() {
		return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, window.String.empty);
	};
}

window.String.prototype.zeroPad = function(length) {
	return this.padLeft(length, 0..toString());
};

window.argumentsArray = function(a) {
	var b = [ ], i;

	for (i = 0; i < a.length; i++) {
		b.push(a[i]);
	}
	return b;
};

window.formatAjaxError = function(textStatus, errorThrown) {
	var errorText = "";

	if (textStatus) {
		if (errorThrown && errorThrown !== textStatus) {
			errorText = String.format("{1} (Status: {0})",
				textStatus, errorThrown);
		} else {
			errorText = textStatus;
		}
	} else if (errorThrown) {
		errorText = errorThrown;
	}
	if (!(errorText && errorText.length)) {
		errorText = "Unknown network error";
	}
	return errorText;
};

window.formatDateInterval = function(interval, options) {
	var getPart = function(name, mod, singular, plural) {
			var value = 0;

			if (interval >= mod) {
				value = Math.floor(interval / mod);
				interval -= value * mod;
				hasValue = true;
			}
			parts[name] = {
				"text": (value === 1) ?
					singular :
					plural,
				"value": value
			};
		},
		hasValue,
		name,
		parts = { },
		result = [ ],
		reverse;

	options = window.jQuery.extend({ }, {
		  "day": " day"
		, "days": " days"
		, "hour": " hour"
		, "hours": " hours"
		, "includeMilliseconds": false
		, "millisecond": " millisecond"
		, "milliseconds": " milliseconds"
		, "minute": " minute"
		, "minutes": " minutes"
		, "month": " month"
		, "months": " months"
		, "second": " second"
		, "seconds": " seconds"
		, "separator": ", "
		, "week": " week"
		, "weeks": " weeks"
		, "year": " year"
		, "years": " years"
	}, options);

	if ((interval = interval || 0) === 0) {
		result.push(0..toString() + options.seconds);
	} else {
		if (reverse = interval < 0) {
			interval = -interval;
		}
		getPart("years", 365.25 * 24 * 60 * 60 * 1000, options.year, options.years);
		getPart("months", 30.4 * 24 * 60 * 60 * 1000, options.month, options.months);
		getPart("weeks", 7 * 24 * 60 * 60 * 1000, options.week, options.weeks);
		if (!parts.years.value) {
			getPart("days", 24 * 60 * 60 * 1000, options.day, options.days);
			if (!parts.months.value) {
				getPart("hours", 60 * 60 * 1000, options.hour, options.hours);
				if (!(parts.weeks.value || parts.days.value)) {
					getPart("minutes", 60 * 1000, options.minute, options.minutes);
					getPart("seconds", 1000, options.second, options.seconds);
					if (options.includeMilliseconds || !hasValue) {
						getPart("milliseconds", 1, options.millisecond, options.milliseconds);
					}
				}
			}
		}
		for (name in parts) {
			var part = parts[name];

			if (part.text && part.text.length && part.value) {
				result.push(part.value + part.text);
			}
		}
		if (reverse) {
			result[0] = "-" + result[0];
		}
	}
	return result.join(options.separator);
};

window.formatFileSize = function(n, options) {
	var s;

	if (!isNaN(n = parseInt(n))) {
		var g = n < 0,
			m = 0x002D;

		if (g) {
			n = -n;
		}
		if (n === 0) {
			s = "0 bytes";
		} else if (n === 1) {
			s = "1 byte";
		} else {
			var c = 0x0400, d = 10, h = Math.pow(d, 2),
				l = Math.log(c), s = 0x0020,
				ss = [
					"bytes",
					"KB",
					"MB",
					"GB",
					"TB",
					"PB",
					"EB"
				];

			var i = Math.floor(Math.log(n) / l),
				r = Math.pow(d, (i < 2) ? 1 : 2),
				t = Math.pow(c, Math.ceil(Math.log(n) / l));

			if (n > Math.pow(d, 3 * (i + 1)) && n < t) {
				n = Math.floor(n / t * h) / h;
				i++;
			} else {
				n = Math.round(n / Math.pow(c, i) * r) / r;
			}
			s = n.toLocaleString(undefined, options) + String.fromCharCode(s) + ss[i];
		}
		if (g) {
			s = String.fromCharCode(m) + s;
		}
	}
	return s;
};

window.guid = function() {
	/* return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0;

		return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	}); */
	return Array(33).join("i").replace(/i/g, function(c) {
		return Math.floor(Math.random() * 16).toString(16);
	});
};

window.parseArguments = function(a) {
	var j, p, parameters = { };

	a = a.split("&");

	for (var i = 0; i < a.length; i++) {
		p = a[i], j = p.indexOf("=");

		parameters[window.decodeURIComponent(p.substr(0, j))] =
			window.decodeURIComponent(p.substr(j + 1));
	}
	return parameters;
};

window.randomColor = function(randomizeAlpha) {
	return (randomizeAlpha) ?
		"rgba({0}, {1}, {2}, {3})".format(Math.floor(Math.random() * 255),
			Math.floor(Math.random() * 255),
			Math.floor(Math.random() * 255),
			Math.random() * 0.5 + 0.5) :
		"#" + ((1 << 24) * (Math.random() + 1) | 0).toString(16).substr(1);
};

window.Number.prototype.fileSize = function() {
	return window.formatFileSize(this);
};

window.location.get = function(name) {
	var parameters = window.location.parameters;

	name = name.toLowerCase();
	for (var i in parameters) {
		if (i.toLowerCase() === name) {
			return parameters[i];
		}
	}
};

window.location.noHash = function(url) {
	url = url || window.location.href;

	var p = url.indexOf("#");

	if (p >= 0) {
		url = url.substr(0, p);
	}
	return url;
};

window.location.noProtocol = function(url) {
	url = url || window.location.href;

	var p = url.indexOf(":"),
		q = url.indexOf("/");

	if (p >= 0 && q >= 0 && p < q) {
		url = url.substr(p + 1);
	}
	while (url.length && url[0] === "/") {
		url = url.substr(1);
	}
	return url;
};

window.location.sameProtocol = function(url) {
	url = "//" + window.location.noProtocol(url || window.location.href);

	if (window.location.protocol.match(/http/i)) {
		url = window.location.protocol + url;
	} else {
		url = "http:" + url;
	}
	return url;
};

window.location.set = function(newParameters, parametersToRemove) {
	var f, href = window.location.href,
		i = href.indexOf("?"),
		parameters = window.location.parameters;

	if (i >= 0) {
		href = href.substr(0, i);
	}
	if (parametersToRemove) {
		for (i = 0; i < parametersToRemove.length; i++) {
			delete parameters[parametersToRemove[i]];
		}
	}
	if (newParameters) {
		for (i in newParameters) {
			if (newParameters[i] !== undefined) {
				parameters[i] = newParameters[i];
			}
		}
	}
	f = false;
	for (i in parameters) {
		if (!f) {
			href += "?";
			f = true;
		} else {
			href += "&";
		}
		href += window.encodeURIComponent(i) + "=" +
			window.encodeURIComponent(parameters[i]);
	}
	return href;
};

(function() {
	var bodyElement,
		dimensions1,
		dimensions2,
		innerElement = document.createElement("p"),
		outerElement = document.createElement("div"),
		rootElement;

	innerElement.style.width = "100%";
	innerElement.style.height = "200px";

	outerElement.style.position = "absolute";
	outerElement.style.top = "0px";
	outerElement.style.left = "0px";
	//outerElement.style.visibility = "hidden";
	outerElement.style.width = "200px";
	outerElement.style.height = "150px";
	outerElement.style.overflow = "hidden";
	outerElement.appendChild(innerElement);

	if (document.body) {
		document.body.appendChild(outerElement);
	} else {
		rootElement = document.documentElement;
		bodyElement = document.createElement("body");
		rootElement.appendChild(bodyElement);
		bodyElement.appendChild(outerElement);
	}
	dimensions1 = {
		"height": innerElement.offsetHeight,
		"width": innerElement.offsetWidth
	};
	outerElement.style.overflow = 'scroll';
	dimensions2 = {
		"height": innerElement.offsetHeight,
		"width": innerElement.offsetWidth
	};
	if (dimensions2.width === dimensions1.width) {
		dimensions2.width = outerElement.clientWidth;
	}
	if (dimensions2.height === dimensions1.height) {
		dimensions2.height = outerElement.clientHeight;
	}
	if (rootElement) {
		rootElement.removeChild(bodyElement);
	} else {
		document.body.removeChild(outerElement);
	}

	if (!window.scrollbars) {
		window.scrollbars = { };
	}
	window.scrollbars.height = 150 - dimensions2.height;
	window.scrollbars.width = dimensions1.width - dimensions2.width;
})();

window.moveCaretToStart = function(input) {
	try {
		if (input.createTextRange) {
			var range = input.createTextRange();

			range.move("character", 0);
			range.select();
		} else if (input.setSelectionRange) {
			input.setSelectionRange(0, 0);
		}
	} catch (ex) { }
};

window.parseColor = function(color) {
	var element = document.createElement("div"),
		i,
		newColor;

	document.body.appendChild(element);
	try {
		color = color.replace(/#/g, "");

		if (color.match(/^([0-9a-f]{3,4})$/i)) {
			newColor = "";

			for (i = 0; i < color.length; i++) {
				newColor += color[i];
				newColor += color[i];
			}
			color = newColor;
		}
		if (color.length === 8) {
			color = "rgba(" +
				window.parseInt(color.substr(0, 2), 16) +
				", " +
				window.parseInt(color.substr(2, 2), 16) +
				", " +
				window.parseInt(color.substr(4, 2), 16) +
				", " +
				window.parseInt(color.substr(6, 2), 16) / 255 +
				")";
		}
		if (color.match(/^([0-9a-f]*)$/i)) {
			color = "#" + color;
		}
		element.style.color = color;
		color = window.getComputedStyle(element).color;
		color = color.split(/\(|\)/)[1].split(/,/);
		if (color.length == 3) {
			color.push(1);
		}
	} finally {
		document.body.removeChild(element);
	}
	return {
		"r": window.parseInt(color[0]),
		"g": window.parseInt(color[1]),
		"b": window.parseInt(color[2]),
		"a": Math.round(window.parseFloat(color[3]) * 255)
	};
};

window.selectText = function(element) {
	var range, selection;

    if (document.body && document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (document.createRange && window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
};

(function() {
	var a, j, p, parameters = { };

	var storage = function() {
		var _contents = { };

		return {
			clear: function() {
				_contents = { };
			},
			getItem: function(key) {
				return _contents[key];
			},
			removeItem: function(key) {
				delete _contents[key];
			},
			setItem: function(key, value) {
				_contents[key] = value;
			}
		};
	};

	try {
		if (!window.localStorage) {
			try {
				window.localStorage = new storage();
			} catch (e) { }
		}
	} catch (e) {
		try {
			window.localStorage = new storage();
		} catch (e) { }
	}

	try {
		if (!window.sessionStorage) {
			try {
				window.sessionStorage = new storage();
			} catch (e) { }
		}
	} catch (e) {
		try {
			window.sessionStorage = new storage();
		} catch (e) { }
	}

	if (window.location.search && window.location.search.length) {
		a = window.parseArguments(window.location.search.substr(1));
		for (var i in a) {
			parameters[i] = a[i];
		}
	}
	for (a in window.location.parameters = parameters) {
		window.location[a] = parameters[a];
	}

	window.DEBUG = !!window.location.get("debug");
	window.isWebApp = screen.width === (window.outerWidth || window.innerWidth) &&
		screen.height - (window.outerHeight || window.innerHeight) <= 32;
})();

if (window.jQuery) {
	var CSS_VENDORS = [
		"-moz-",
		"-ms-",
		"-o-",
		"-webkit-",
		String.empty
	];

	window.jQuery.afterTimeout = function(fn, interval) {
		return window.jQuery.Deferred(function(deferred) {
			deferred.abort = function() {
				window.clearTimeout(this.timeoutID);
			};
			deferred.timeoutID = window.setTimeout(function() {
				try {
					window.jQuery.when(fn()).then(deferred.resolve,
						deferred.reject);
				} catch (e) {
					deferred.reject(e);
				}
			}, interval);
		}).promise();
	};

	window.jQuery.ajaxSetup({
		"timeout": parseInt(window.location.get("timeout")) || 30000
	});

	window.jQuery.eachProp = function(o, callback) {
		var name;

		if (window.jQuery.isPlainObject(o)) {
			for (name in o) {
				if (callback(name, o[name]) === false) {
					break;
				}
			}
		}
		return o;
	};

	window.jQuery.Event.prototype.preventAll = function() {
		this.stopPropagation();
		this.stopImmediatePropagation();
		this.preventDefault();
		return false;
	};

	window.jQuery.fn.eachProp = function(callback) {
		return window.jQuery(this).each(function(i, item) {
			window.jQuery.eachProp(item, callback);
		});
	};

	window.jQuery.fn.props = function() {
		var properties = [ ];

		window.jQuery(this).each(function(i, item) {
			window.jQuery(window.jQuery.props(item)).each(function(j, property) {
				properties.push(property);
			});
		});
		return properties;
	};

	window.jQuery.fn.vendorSpecificCss = function(name, value) {
		var target = window.jQuery(this);

		if (value === undefined) {
			if (window.jQuery.isPlainObject(name)) {
				window.jQuery(name).eachProp(function(cssName, cssValue) {
					target.vendorSpecificCss(cssName, cssValue)
				});
			} else {
				for (var i = 0, vendor, cssValue; vendor = CSS_VENDORS[i]; i++) {
					if ((cssValue = target.css(vendor + name)) !== undefined) {
						return cssValue;
					}
				}
				return;
			}
		} else {
			for (var i = 0, vendor; vendor = CSS_VENDORS[i]; i++) {
				target.css(vendor + name, value);
			};
		}
		return target;
	};

	window.jQuery.keyboard = (function() {
		var kb = {
			"_keys": { }
		};

		var handler = function(e, flag) {
			var key = String.fromCharCode(e.which).toLowerCase();

			kb._keys[key] = flag;
		};

		window.jQuery(document).on({
			"keydown": function(e) {
				window.jQuery(kb).trigger(window.jQuery.extend({ }, e, window.jQuery.Event("keydown.keyboard")));
			},
			"keypress": function(e) {
				handler(e, true);
				window.jQuery(kb).trigger(window.jQuery.extend({ }, e, window.jQuery.Event("keypress.keyboard")));
			},
			"keyup": function(e) {
				handler(e, false);
				window.jQuery(kb).trigger(window.jQuery.extend({ }, e, window.jQuery.Event("keyup.keyboard")));
			}
		});

		kb.isPressed = function(key) {
			key = key.toLowerCase();

			if (key in kb._keys) {
				return kb._keys[key];
			}

			return false;
		};

		kb.lockNavigation = function(element) {
			if (!element) {
				element = document;
			}
			window.jQuery(element).on({
				"keydown": function(e) {
					var activeElement,
						consume = false;

					switch (e.which) {
						case 8:		// Backspace
							activeElement = window.jQuery(document.activeElement);

							consume = !activeElement.length ||
								(!(activeElement.is("input:focus") ||
								activeElement.is("textarea:focus") ||
								activeElement.attr("contentEditable") !== undefined));
							break;
						case 36:	// Home
						case 37:	// Left Arrow
						case 39:	// Right Arrow
							consume = e.altKey;
							break;
						case 116:	// F5
							consume = true;
							break;
						case 9:		// Tab
						case 16:	// Shift
						case 17:	// Control
						case 18:	// Alt (Menu)
						case 93:	// Apps (Context Menu)
							break;
						default:
							/* debugger; */
							break;
					}
					if (consume) {
						return e.preventAll();
					}
				}
			});
		};

		kb.numericInput = function(input) {
			window.jQuery(input).on({
				"keydown": function(e) {
					switch (e.which) {
						case   8: case   9: case  13: case  35: case  36: case  37: case  38: case  39:
						case  40: case  46: case  48: case  49: case  50: case  51: case  52: case  53:
						case  54: case  55: case  56: case  57: case  96: case  97: case  98: case  99:
						case 100: case 101: case 102: case 103: case 104: case 105: case 123:
							return true;
					}
					return false;
				}
			});
		};

		return kb;
	})();

	window.jQuery.pool = function(size, provider, callback) {
		return window.jQuery.Deferred(function(deferred) {
			var count = 0,
				i,
				globalIndex = -1,
				start = function(index) {
					var step = provider(++globalIndex, index);

					if (step) {
						count++;
						window.jQuery.when(callback(step, globalIndex, index))
							.then(function() {
								if (--count === 0 && size > 1) {
									deferred.resolve();
								} else {
									start(index);
								}
							}, function() {
								deferred.reject();
							});
					} else if (count === 0) {
						deferred.resolve();
					}
				};

			for (i = 0; i < (size = size || 1); i++) {
				start(i);
			}
		}).promise();
	};

	window.jQuery.props = function(o) {
		var name, names = [ ];

		if (window.jQuery.isPlainObject(o)) {
			for (name in o) {
				names.push(name);
			}
		}
		return names;
	};

	window.jQuery.sequence = function(sequence, callback) {
		return window.jQuery.Deferred(function(deferred) {
			var fn, i = -1;

			(fn = function() {
				if (i < sequence.length - 1) {
					window.jQuery.when((callback) ?
						callback(sequence[++i]) :
						(window.jQuery.isFunction(sequence[++i])) ?
							sequence[i]() :
							sequence[i]).then(fn, deferred.reject);
				} else {
					deferred.resolve();
				}
			})();
		}).promise();
	};

	if (window.jQuery.ui) {
		/* Themes */
		(function() {
			var uiVersion = window.jQuery.ui.version;

			window.jQuery.ui.themes = [
			/* 00 */	  { "name": "Base"			, "theme": "#f0eff0", "color": "#ffffff" }
			/* 01 */	, { "name": "Black tie"		, "theme": "#373737", "color": "#fdfdfd" }
			/* 02 */	, { "name": "Blitzer"       , "theme": "#cc0000", "color": "#ffffff" }
			/* 03 */	, { "name": "Cupertino"     , "theme": "#deedf7", "color": "#fafbfc" }
			/* 04 */	, { "name": "Dark Hive"     , "theme": "#222222", "color": "#000000" }
			/* 05 */	, { "name": "Dot LUV"       , "theme": "#1d4c7a", "color": "#2a2a2a" }
			/* 06 */	, { "name": "Eggplant"      , "theme": "#30273a", "color": "#5c5662" }
			/* 07 */	, { "name": "Excite Bike"   , "theme": "#2e92e9", "color": "#f9f9f9" }
			/* 08 */	, { "name": "Flick"         , "theme": "#dddddd", "color": "#ffffff" }
			/* 09 */	, { "name": "Hot Sneaks"    , "theme": "#58626e", "color": "#ffffff" }
			/* 10 */	, { "name": "Humanity"      , "theme": "#f5f0e6", "color": "#fbf9f8" }
			/* 11 */	, { "name": "Le Frog"       , "theme": "#4ca20b", "color": "#35660f" }
			/* 12 */	, { "name": "Mint Choc"     , "theme": "#4e3d30", "color": "#2d2621" }
			/* 13 */	, { "name": "Overcast"      , "theme": "#eeeeee", "color": "#dadada" }
			/* 14 */	, { "name": "Pepper Grinder", "theme": "#654b24", "color": "#eceadf" }
			/* 15 */	, { "name": "Redmond"       , "theme": "#6da6d2", "color": "#feffff" }
			/* 16 */	, { "name": "Smoothness"    , "theme": "#f0eff0", "color": "#ffffff" }
			/* 17 */	, { "name": "South Street"  , "theme": "#d4ccb0", "color": "#fbfbf5" }
			/* 18 */	, { "name": "Start"         , "theme": "#459dc4", "color": "#fcfdfd" }
			/* 19 */	, { "name": "Sunny"         , "theme": "#ffd445", "color": "#fff9e5" }
			/* 20 */	, { "name": "Swanky Purse"  , "theme": "#eac253", "color": "#443113" }
			/* 21 */	, { "name": "Trontastic"    , "theme": "#b8ec79", "color": "#494949" }
			/* 22 */	, { "name": "UI Darkness"   , "theme": "#3b3b3b", "color": "#000000" }
			/* 23 */	, { "name": "UI Lightness"  , "theme": "#f7ad34", "color": "#eeeeee" }
			/* 24 */	, { "name": "Vader"         , "theme": "#000000", "color": "#121212" }
			];

			if (window.jQuery.ui.version.match(/^1.10.|1.11./i)) {
				window.jQuery.ui.themes.splice(0, 1);
			}
			window.jQuery.ui.themes = window.jQuery.map(window.jQuery.ui.themes, function(theme) {
				return {
					  "group": "Official"
					, "name": theme.name
					, "color": theme.color
					, "theme": theme.theme
					, "url": window.location.sameProtocol(String
						.format("code.jquery.com/ui/{0}/themes/{1}/jquery-ui.min.css",
							uiVersion, ((theme.url && theme.url.length) ? theme.url : theme.name).replace(" ", "-").toLowerCase()))
				};
			});
			window.jQuery.ui.autoTheme = function() {
				window.jQuery("link[rel=stylesheet]").each(function(i, link) {
					var found,
						href = window.location.sameProtocol((link = window.jQuery(link))
						.attr("href")).toLowerCase();

					window.jQuery(window.jQuery.ui.themes).each(function(j, theme) {
						if (href === theme.url.toLowerCase()) {
							found = true;

							var themeColor = window.jQuery("meta[name=theme-color]");

							if (!themeColor.length) {
								themeColor = window.jQuery(document.createElement("meta"))
									.attr({
										"name": "theme-color"
									})
									.appendTo(window.jQuery("head"));
							}
							themeColor.attr("content", theme.theme);
							return false;
						}
					});
					if (found) {
						return false;
					}
				});
			};

			window.jQuery.fn.themeSelector = function(options) {
				var themeElement = window.jQuery(this).empty(),
					themeGroups = [ ],
					themeGroupsKeys = { };

				var isValidTheme = function(theme) {
					var valid = true,
						themeProtocol = theme.url.split("/")[0];

					if (themeProtocol &&
						themeProtocol.length &&
						themeProtocol.indexOf(":") &&
						window.location.protocol.match(/https/i)) {

						valid = themeProtocol.toLowerCase() ===
							window.location.protocol.toLowerCase();
					}
					return valid;
				};

				window.jQuery(window.jQuery.ui.themes).each(function(i, theme) {
					if (isValidTheme(theme)) {
						if (!themeGroupsKeys[theme.group]) {
							themeGroupsKeys[theme.group] = theme.group;
							themeGroups.push(theme.group);
						}
					}
				});
				window.jQuery(themeGroups).each(function(i, group) {
					var groupElement = window.jQuery(document.createElement("optgroup"))
						.attr({
							"label": group
						})
						.appendTo(themeElement);
					window.jQuery(window.jQuery.ui.themes).each(function(j, theme) {
						if (isValidTheme(theme) && theme.group === group) {
							window.jQuery(window.jQuery.ui.themes).each(function(k, themeAgain) {
								if (themeAgain === theme) {
									groupElement.append(window.jQuery(document.createElement("option"))
										.text(themeAgain.name)
										.data({
											"theme-color": themeAgain.color,
											"theme-theme": themeAgain.theme,
											"theme-url": themeAgain.url
										})
										.val(k));
									return false;
								}
							});
						}
					});
				});
				return themeElement;
			};

			/*
			, { "name": "Aristo" 			, "group": "Custom"	, "url": "http://taitems.github.com/Aristo-jQuery-UI-Theme/css/Aristo/Aristo.css" }
			, { "name": "Bootstrap" 		, "group": "Custom"	, "url": "http://addyosmani.github.io/jquery-ui-bootstrap/css/custom-theme/jquery-ui-1.10.3.custom.css" }
			, { "name": "Selene" 			, "group": "Custom"	, "url": "http://gravityonmars.github.com/Selene/css/ui-selene/jquery-ui-1.8.17.custom.css" }
			, { "name": "Delta" 			, "group": "Custom"	, "url": "http://kiandra.github.com/Delta-jQuery-UI-Theme/theme/jquery-ui.css" }

			, { "name": "Arctic" 			, "group": "WIJMO"	, "url": "http://cdn.wijmo.com/themes/arctic/jquery-wijmo.css" }
			, { "name": "Aristo" 			, "group": "WIJMO"	, "url": "http://cdn.wijmo.com/themes/aristo/jquery-wijmo.css" }
			, { "name": "Bootstrap" 		, "group": "WIJMO"	, "url": "http://cdn.wijmo.com/themes/bootstrap/jquery-ui.css" }
			, { "name": "Cobalt" 			, "group": "WIJMO"	, "url": "http://cdn.wijmo.com/themes/cobalt/jquery-wijmo.css" }
			, { "name": "Metro" 			, "group": "WIJMO"	, "url": "http://cdn.wijmo.com/themes/metro/jquery-wijmo.css" }
			, { "name": "Metro (dark)" 		, "group": "WIJMO"	, "url": "http://cdn.wijmo.com/themes/metro-dark/jquery-wijmo.css" }
			, { "name": "Midnight" 			, "group": "WIJMO"	, "url": "http://cdn.wijmo.com/themes/midnight/jquery-wijmo.css" }
			, { "name": "Rocket" 			, "group": "WIJMO"	, "url": "http://cdn.wijmo.com/themes/rocket/jquery-wijmo.css" }
			, { "name": "Sterling" 			, "group": "WIJMO"	, "url": "http://cdn.wijmo.com/themes/sterling/jquery-wijmo.css" }
			*/
		})();

		/* Loader */
		(function() {
			var _cancelable = false,
				_cancelButtonText = String.empty,
				_canceled = false,
				_dialog = function() {
					var dialog = window.jQuery(".loaderDialog");

					if (!dialog.length) {
						dialog = window.jQuery(document.createElement("div"))
							.addClass("dialog")
							.addClass("loaderDialog")
							.append(window.jQuery(document.createElement("div")).addClass("loadingProgress"))
							.append(window.jQuery(document.createElement("div")).addClass("loadingMessage"))
							.append(window.jQuery(document.createElement("button")).attr({ "type": "button" }).addClass("loadingCancelButton"))
							.appendTo(window.jQuery("body"));
					}
					return dialog;
				},
				_loaders = 0;

			window.hideLoader = function() {
				if (_loaders > 0 && --_loaders === 0) {
					_dialog().dialog("close");
				}
			};

			window.showLoader = function(message, cancelable) {
				if (message !== undefined) {
					window.loader.message(message);
				}
				window.loader.cancelable((cancelable !== undefined) ?
					cancelable : _cancelable);
				if (_loaders++ === 0) {
					return window.jQuery.Deferred(function(deferred) {
						_dialog().dialog({
							"closeOnEscape": false,
							"dialogClass": "no-title",
							"hide": true,
							"modal": true,
							"open": function(event, ui) {
								window.jQuery(this)
									.css({
										"min-height": 0
									})
									.parent()
									.promise()
									.done(deferred.resolve);
							},
							"resizable": false,
							"show": true,
							"width": "auto"
						});
					}).promise();
				}
			};

			window.loading = function(fn, message, cancelable) {
				if (cancelable !== undefined) {
					window.loader.cancelable(cancelable);
				}
				return window.jQuery.when(window.showLoader(message)).then(function() {
					try {
						return fn();
					} catch (e) {
						if (window.console && window.console.warn) {
							window.console.warn(e);
						}
						if (window.jQuery.toast && window.jQuery.toast.error) {
							window.jQuery.toast.error(e.message);
						}
					}
				}).always(window.hideLoader);
			};

			window.loader =	{
				"cancelable": function(cancelable) {
					var button = _dialog()
						.find(".loadingCancelButton")
						.button("option", "label", _cancelButtonText);

					_canceled = false;
					button[(_cancelable = !!cancelable) ?
						"show" :
						"hide"]();
				},
				"cancelButtonText": function(text) {
					_cancelButtonText = text;
					window.loader.cancelable(_cancelable);
				},
				"count": function() {
					return _loaders;
				},
				"hide": function() {
					return window.hideLoader();
				},
				"isCanceled": function() {
					return _canceled;
				},
				"maximum": function(maximum) {
					return _dialog()
						.find(".loadingProgress")
						.removeClass("animated")
						.progressbar("option", "max", maximum);
				},
				"message": function(message) {
					return _dialog()
						.find(".loadingMessage")
						.html((message || String.empty)
							.toString().replace(/\n/g, "<br/>"));
				},
				"run": function(fn, message) {
					return window.loading(fn, message);
				},
				"show": function(message) {
					return window.showLoader(message);
				},
				"value": function(value) {
					var progress = _dialog()
						.find(".loadingProgress");

					if (typeof value === "boolean") {
						progress.removeClass("animated");
					}
					progress.progressbar("option", "value", value)
					if (typeof value !== "boolean") {
						progress.addClass("animated");
					}
				}
			};

			window.jQuery().ready(function() {
				_dialog()
					.find(".loadingProgress")
						.progressbar({
							"value": false
						})
					.end()
					.find(".loadingCancelButton")
						.button()
						.on({
							"click": function(e) {
								_canceled = true;
								if (_loaders === 1) {
									window.hideLoader();
								}
							}
						});
			});
		})();

		window.jQuery.alert = function(text, title, buttonText) {
			return window.jQuery.Deferred(function(deferred) {
				window.jQuery(document.createElement("div"))
					.attr({
						"title": title || document.title
					})
					.html(text)
					.appendTo(document.body)
					.dialog({
						"buttons": [{
							"click": function(e, ui) {
								window.jQuery(this).dialog("close");
							},
							"text": buttonText || "OK"
						}],
						"dialogClass": "alertDialog",
						"close": function(e, ui) {
							window.jQuery(this)
								.dialog("destroy")
								.off()
								.remove();
							deferred.resolve();
						},
						"hide": true,
						"modal": true,
						"resizable": false,
						"show": true,
						"width": "auto"
					});
			});
		}

		window.jQuery.confirm = function(text, title, buttons) {
			return window.jQuery.Deferred(function(deferred) {
				window.jQuery(document.createElement("div"))
					.attr({
						"title": title || document.title
					})
					.html(text)
					.appendTo(document.body)
					.dialog({
						"buttons": [{
							"click": function(e, ui) {
								window.jQuery(this).dialog("close");
								deferred.resolve();
							},
							"text": (buttons || [ ])[0] || "Yes"
						}, {
							"click": function(e, ui) {
								window.jQuery(this).dialog("close");
							},
							"text": (buttons || [ ])[1] || "No"
						}],
						"close": function(e, ui) {
							window.jQuery(this)
								.dialog("destroy")
								.off()
								.remove();
							if (deferred.state() === "pending") {
								deferred.reject();
							}
						},
						"dialogClass": "confirmDialog",
						"hide": true,
						"maxHeight": "98%",
						"modal": true,
						"resizable": false,
						"show": true,
						"width": "auto"
					});
			});
		};

		window.jQuery.prompt = function(text, value, title, buttons) {
			return window.jQuery.Deferred(function(deferred) {
				var input;

				window.jQuery(document.createElement("div"))
					.attr({
						"title": title || document.title
					})

					/* Previous, non form version: */
					/* .append(document.createTextNode(text))
					.append(document.createElement("br"))
					.append(input = $(document.createElement("input"))
						.val(value)) */
					/* end of previous, non form version */

					/* Version with form: */
					.append($(document.createElement("form"))
						.append($(document.createElement("label"))
							.text(text)
							.append(document.createElement("br"))
							.append(input = $(document.createElement("input"))
								.val(value)))
						.on("submit", function(e) {
							input
								.closest(".ui-dialog")
								.find(".ui-dialog-buttonpane")
								.find(".ui-button")
								.first()
								.click();
							return false;
						}))
					/* end of version with form */

					.appendTo(document.body)
					.dialog({
						"buttons": [{
							"click": function(e, ui) {
								var text = input.val();

								if (text && text.length) {
									window.jQuery(this).dialog("close");
									deferred.resolve(text);
								}
							},
							"text": (buttons || [ ])[0] || "OK"
						}, {
							"click": function(e, ui) {
								window.jQuery(this).dialog("close");
							},
							"text": (buttons || [ ])[1] || "Cancel"
						}],
						"close": function(e, ui) {
							window.jQuery(this)
								.dialog("destroy")
								.off()
								.remove();
							if (deferred.state() === "pending") {
								deferred.reject();
							}
						},
						"dialogClass": "promptDialog",
						"hide": true,
						"maxHeight": "98%",
						"modal": true,
						/* "open": function(e, ui) { moveCaretToStart(input[0]); }, */
						"resizable": false,
						"show": true,
						"width": "auto"
					});
			});
		};

		window.jQuery.toast = function(options) {
			var toastElement,
				toasts = window.jQuery(".toast");

			var closeToast = function() {
				if (toastElement.data("fading")) {
					return toastElement.data("fading").promise();
				}
				toastElement.data("fading", $.Deferred());
				return window.jQuery.when(toastElement.fadeOut())
					.then(function() {
						var deferred = toastElement.data("fading"),
							timeout = toastElement.data("timeout");

						if (timeout) {
							window.clearTimeout(timeout);
							toastElement.remove();
						}
						if (deferred) {
							deferred.resolve();
						}
						return toastElement;
					});
			};

			var resetElement = function() {
				toastElement.data({
					"timeout": window.setTimeout(closeToast, (options.duration) ?
						options.duration :
						(options.slow) ?
							10000 :
							(options.fast) ?
								1000 :
								5000)
				});
			};

			if (!window.jQuery.isPlainObject(options)) {
				options = {
					"text": options
				};
			}

			if (options.close) {
				if ((toastElement = window.jQuery(options.toast).parent()).length) {
					return closeToast();
				}
				return;
			}
			if (options.append && toasts.length) {
				toastElement = toasts.last();

				if (options["class"] === toastElement.data("toastClass")) {
					if (toastElement.data("fading")) {
						toastElement.data("fading").resolve();
						toastElement.removeData("fading");
					}
					window.clearTimeout(toastElement.data("timeout"));
					if (options.text === toastElement.data("lastText")) {
						var textCount = parseInt(toastElement.data("textCount")) || 1;

						toastElement
							.children()
							.first()
							.children()
							.last()
							.text((options.text || String.empty) + " (" + (textCount + 1) + ")");
						toastElement.data("textCount", textCount + 1);
					} else {
						toastElement.removeData("textCount");
						toastElement
							.children()
							.first()
							.append(("<br/><br/><span>" + (options.text || String.empty)
								.toString()).replace(/\n/g, "<br/>") + "</span>");
					}
					toastElement
						.removeData("timeout")
						.data("lastText", options.text)
						.stop(true, false)
						.fadeIn()
					resetElement();
				} else {
					toastElement = undefined;
				}
			}
			if (!toastElement) {
				toastElement = window.jQuery(document.createElement("div"))
					.addClass("toast")
					.append(window.jQuery(document.createElement("div"))
						.addClass("ui-corner-all")
						.addClass("ui-widget-content")
						.addClass("toastContent")
						.on({
							"click": function(e) {
								if (!options.dontHideOnClick) {
									window.clearTimeout(toastElement.data("timeout"));
									closeToast();
								}
								toastElement.trigger("click");
								return false;
							}
						})
						.html("<span>" + (options.text || String.empty)
							.toString().replace(/\n/g, "<br/>") + "</span>"))
					.css({
						"opacity": options.opacity,
						"zIndex": options.zIndex
					})
					.data("lastText", options.text)
					.hide()
					.appendTo(document.body);

				if (options["class"]) {
					toastElement
						.data({
							"toastClass": options["class"]
						})
						.find("div")
						.addClass(options["class"]);
				}
				if (toasts.length) {
					toastElement.css({
						"top": toasts.eq(toasts.length - 1).position().top -
							(toastElement.height() + 8)
					});
				} else {
					toastElement.css({
						"bottom": "1em"
					});
				}
				window.jQuery.when(toastElement.fadeIn()).then(function() {
					resetElement();
				});
			}
			return toastElement;
		};

		window.jQuery.toast.error = function(error) {
			return window.jQuery.toast({
				"append": true,
				"class": "clickable ui-state-error",
				"opacity": 1,
				"slow": true,
				"text": error.toLocaleString()
			});
		};

		window.jQuery.toast.message = function(message) {
			return window.jQuery.toast({
				"append": true,
				"class": "clickable ui-state-default",
				"fast": true,
				"text": message.toLocaleString()
			});
		};

		window.jQuery.toast.warning = function(error) {
			return window.jQuery.toast({
				"append": true,
				"class": "clickable ui-state-highlight",
				"slow": true,
				"text": error.toLocaleString()
			});
		};
	}
}
