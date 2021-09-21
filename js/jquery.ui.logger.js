"use strict";

if (window.jQuery) {
	(function() {
		var __loggerDataName = "logger",
			__loggerClass = "ui-" + __loggerDataName + "-panel",
			__loggerName = "__" + __loggerDataName;

		window.jQuery.widget("." + __loggerDataName, {
			options: {
				date: true,
				itemCSS: { },
				itemClass: "",
				scroll: true,
				tagName: "div",
			},
			_create: function() {
				window[__loggerName] = window[__loggerName] || (function() {
					var instance = {
						create: function() {
							var i = this, name;

							if (this.console = window.console) {
								for (name in this.methods) {
									if (this.methods[name].method = this.console[name]) {
										(function() {
											var key = name;

											i.console[key + "_"] = i.console[key];
											i.console[key] = function() {
												var a = [ ], e = window.jQuery.Event(key + "." + __loggerDataName + ".before"), j;

												for (j = 0; j < arguments.length; j++) a.push(arguments[j]);
												window.jQuery("." + __loggerClass).trigger(e, a);
												if (!e.isDefaultPrevented()) {
													i.methods[key].method.apply(i.console, arguments);
													i.write(a.join(), i.methods[key].className);
													window.jQuery("." + __loggerClass).trigger(key + "." + __loggerDataName, a);
												}
											};
										})();
									}
								}
							}
						},
						destroy: function() {
							var name;

							for (name in this.methods) {
								this.console[name] = this.methods[name].method;
							}
						},
						methods: {
							  error: { className: "error" }
							, info: { className: "default" }
							, log: { className: "active" }
							, trace: { className: "default" }
							, warn: { className: "highlight" }
						},
						write: function(message, className) {
							var dateString = function() {
								var date = new Date(),
									zeroPad = function(n, l) {
										var s = n.toString();

										while (s.length < l) {
											s = 0..toString() + s;
										}
										return s;
									};

								return zeroPad(date.getHours(), 2) + ":" +
									zeroPad(date.getMinutes(), 2) + ":" +
									zeroPad(date.getSeconds(), 2) + "." +
									zeroPad(date.getMilliseconds(), 3);
							}, elements = window.jQuery("." + __loggerClass);

							elements.each(function(i) {
								var element = window.jQuery(this),
									item,
									options = element.data(__loggerDataName).options,
									parent;

								element.append(item = window.jQuery(document.createElement(options.tagName))
									.addClass("ui-state-" + className)
									.text(((options.date) ? (dateString() + ": ") : "") + message));

								if (options.itemClass && options.itemClass.length) {
									item.addClass(options.itemClass);
								}
								if (options.itemCSS) {
									item.css(options.itemCSS);
								}

								if (options.scroll) {
									if (!(parent = element.scrollParent())
										.parents().length) {

										parent = window.jQuery(document.body);
									}
									parent.scrollTop(parent[0].scrollHeight);
								}
							});
						}
					};
					instance.create();
					return instance;
				})();
				if (!this.element.hasClass(__loggerClass)) {
					this.element.addClass(__loggerClass);
				}
				if (!this.element.data(__loggerDataName)) {
					this.element.data(__loggerDataName, this);
				}
			},
			_destroy: function() {
				this.element
					.removeClass(__loggerClass)
					.removeData(__loggerDataName);
				if (!window.jQuery("." + __loggerClass).length && window[__loggerName]) {
					window[__loggerName].destroy();
					delete window[__loggerName];
				}
			}
		});
	})();
}
