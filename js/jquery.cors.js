"use strict";

if (window.jQuery) {
	var proxies = [
		{
			  "about": "http://alloworigin.com/"
			, "active": false
			, "name": "Allow Origin"
			, "noProtocol": false
			, "priority": 10
			, "supports": {
				  "CORS": true
				, "HTTPS": true
				, "JSONP": true
				, "nonJSON": true
			}
			, "url": "http://alloworigin.com/get?url={0}"
		},
		{
			  "about": "http://anyorigin.com/"
			, "active": false
			, "converter": function(data, type, textStatus, jqXHR) {
				if (!window.jQuery.isPlainObject(data.contents)) {
					try {
						data.contents = window.jQuery.parseJSON(data.contents);
					} catch (e) { }
				}
				return data.contents;
			}
			, "name": "Any Origin"
			, "noProtocol": false
			, "priority": 6
			, "supports": {
				  "CORS": false
				, "HTTPS": false
				, "JSONP": true
				, "nonJSON": true
			}
			, "url": "http://anyorigin.com/go/?url={0}"
		},
		{
			  "about": "http://crossorigin.me/"
			, "active": false
			, "name": "Crossorigin.me"
			, "noProtocol": false
			, "priority": 3
			, "supports": {
				  "CORS": true
				, "HTTPS": false
				, "JSONP": false
				, "nonJSON": true
			}
			, "url": "http://crossorigin.me/{0}"
			, "obsolete-url": "https://dry-sierra-94326.herokuapp.com/{0}"
		},
		{
			  "about": "https://github.com/Rob--W/cors-anywhere"
			, "active": true
			, "name": "CORS Anywhere"
			, "noProtocol": true
			, "priority": 2
			, "supports": {
				  "CORS": true
				, "HTTPS": true
				, "JSONP": false
				, "nonJSON": true
			}
			, "url": "http://cors-anywhere.herokuapp.com/{0}"
		},
		{
			  "about": "https://cors.io/"
			, "active": false
			, "name": "CORS.io"
			, "noProtocol": false
			, "priority": 9
			, "supports": {
				  "CORS": true
				, "HTTPS": true
				, "HTTPSOnly": true
				, "JSONP": false
				, "nonJSON": true
			}
			, "url": "https://cors.io/?{0}"
		},
		{
			  "about": "http://cors-proxy.htmldriven.com/"
			, "active": false
			, "converter": function(data, type, textStatus, jqXHR) {
				if (data && !window.jQuery.isPlainObject(data)) {
					try {
						data = window.jQuery.parseJSON(data);
					} catch (e) { }
				}
				if (data && data.body) {
					if ((data = data.body) && !window.jQuery.isPlainObject(data)) {
						try {
							data = window.jQuery.parseJSON(data);
						} catch (e) { }
					}
				}
				return data;
			}
			, "name": "HTML Driven"
			, "noProtocol": false
			, "priority": 7
			, "supports": {
				  "CORS": true
				, "HTTPS": false
				, "JSONP": false
				, "nonJSON": true
			}
			, "url": "http://cors-proxy.htmldriven.com/?url={0}"
		},
		{
			  "about": "https://jsonp.afeld.me/"
			, "active": true
			, "name": "JSONProxy"
			, "noProtocol": false
			, "priority": 5
			, "supports": {
				  "CORS": false
				, "HTTPS": true
				, "JSONP": true
				, "nonJSON": true
			}
			, "url": "http://jsonp.afeld.me/?url={0}"
			, "obsolete-url": "http://jsonp.herokuapp.com/?url={0}"
		},
		{
			  "about": "http://localhost/"
			, "active": true
			, "converter": function(data, type, textStatus, jqXHR) {
				var result;

				if (type && type.match(/json/i)) {
					if (type.match(/jsonp/i)) {
						data = data.contents;
					}
					if (!window.jQuery.isPlainObject(data)) {
						try {
							data = window.jQuery.parseJSON(data);
						} catch (e) { }
					}
				}
				return data;
			}
			, "local": true
			, "name": "Local CORS Proxy"
			, "noProtocol": true
			, "priority": 1
			, "supports": {
				  "CORS": true
				, "HTTPS": false
				, "JSONP": true
				, "nonJSON": true
			}
			, "url": "http://localhost/home/dropbox/web/cors/proxy.aspx?route={0}"
		},
		{
			  "about": "https://github.com/Freeboard/thingproxy/"
			, "active": false
			, "name": "ThingProxy"
			, "noProtocol": false
			, "priority": 8
			, "supports": {
				  "CORS": true
				, "HTTPS": true
				, "JSONP": false
				, "nonJSON": true
			}
			, "url": "https://thingproxy.freeboard.io/fetch/{0}"
		},
		{
			  "about": "http://www.whateverorigin.org/"
			, "active": false
			, "converter": function(data, type, textStatus, jqXHR) {
				if (!window.jQuery.isPlainObject(data.contents)) {
					try {
						data.contents = window.jQuery.parseJSON(data.contents);
					} catch (e) { }
				}
				return data.contents;
			}
			, "name": "Whatever Origin"
			, "noProtocol": false
			, "priority": 4
			, "supports": {
				  "CORS": false
				, "HTTPS": false
				, "JSONP": true
				, "nonJSON": true
			}
			, "url": "http://whateverorigin.org/get?url={0}"
		}];

	window.jQuery.CORS = window.jQuery.extend(window.jQuery.CORS || { }, {
		proxies: proxies
	});
	window.jQuery(proxies).each(function(i) {
		window.jQuery.extend(this, {
			"ajax": function(options) {
				var noProtocol,
					proxy = this,
					proxyURL,
					sameProtocol,
					url;

				noProtocol = function(url) {
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
				sameProtocol = function(url) {
					return ((window.location.protocol.match(/http/i)) ?
						window.location.protocol :
						"http:") + "//" + noProtocol(url);
				};

				options = window.jQuery.extend({ }, options);
				if (options.dataType !== undefined) {
					if (options.dataType.match(/jsonp/i) && !(this.supports && this.supports.JSONP)) {
						options.dataType = "json";
					}
				} else if (this.supports && this.supports.JSONP) {
					options.dataType = "jsonp";
				} else if (this.supports && this.supports.CORS) {
					//options.dataType = "json";
				}
				proxyURL = (this.supports && this.supports.HTTPS) ?
					(this.supports.HTTPSOnly) ?
						this.url :
						sameProtocol(this.url) :
					"http://" + noProtocol(this.url),
				url = (this.noProtocol) ?
					noProtocol(options.url) :
					sameProtocol(options.url);

				return window.jQuery.ajax(window.jQuery.extend({ }, options, {
					"crossDomain": true,
					"dataType": (options.dataType && options.dataType.match(/jsonp/i)) ? options.dataType : "text",
					"url": proxyURL.format(url)
				})).then(function(data, textStatus, jqXHR) {
					var result = window.jQuery.Deferred();

					if (options.dataType &&
						options.dataType.match(/json/i) &&
						!options.dataType.match(/jsonp/i)) {

						try {
							data = window.jQuery.parseJSON(data);
						} catch (e) { }
					}
					if (proxy.converter) {
						try {
							data = proxy.converter.call(this, data, options.dataType, textStatus, jqXHR);
							result.resolve(data, textStatus, jqXHR);
						} catch (e) {
							result.reject(jqXHR, textStatus, e.message);
						}
					} else {
						result.resolve(data, textStatus, jqXHR);
					}
					return result.promise();
				});
			},
			"get": function(url) {
				return this.ajax({
					"url": url
				});
			},
			"getJSON": function(url) {
				return this.ajax({
					"dataType": "json",
					"url": url
				});
			}
		});
	});
	window.jQuery.CORS.chooseBestProxy = function(requirements) {
		var candidates = [ ],
			index,
			isHTTPS = !!window.location.protocol.match(/https/i),
			isLocal = !!window.location.hostname.match(/localhost/i),
			result = window.jQuery.Deferred(),
			testCandidate;

		window.jQuery(proxies).each(function(i) {
			var excluded = false;

			if (!this.active) {
				excluded = true;
			} else if (this.local && !isLocal) {
				excluded = true;
			} else if (isHTTPS && !(this.supports && this.supports.HTTPS)) {
				excluded = true;
			} else if (requirements.CORS && !(this.supports && this.supports.CORS)) {
				excluded = true;
			} else if (requirements.JSONP && !(this.supports && this.supports.JSONP)) {
				excluded = true;
			} else if (requirements.nonJSON && !(this.supports && this.supports.nonJSON)) {
				excluded = true;
			}
			if (!excluded) {
				candidates.push(this);
			}
		});
		if (candidates.length) {
			index = 0;
			candidates.sort(function(a, b) {
				return (a.priority < b.priority) ?
					-1 : (a.priority > b.priority) ?
						1 : 0;
			});
			if (requirements.skipTest) {
				result.resolve(candidates[index]);
			} else {
				(testCandidate = function() {
					return candidates[index][(requirements.nonJSON) ?
						"get" :
						"getJSON"](requirements.url)
						.then(function() {
							result.resolve(candidates[index]);
						}, function(a, b, c) {
							if (index < candidates.length - 1) {
								index++
								testCandidate();
							} else {
								result.reject();
							}
						});
				})();
			}
		} else {
			result.reject();
		}
		return result.promise();
	};
}
