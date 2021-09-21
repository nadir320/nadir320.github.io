if (window.jQuery && window.jQuery.ui) {
	(function() {
		window.sidebar = function(options) {
			var animateTo,
				backdrop,
				createTouchPoint,
				cssPosition = { },
				element,
				instance,
				isRightSide,
				lastPercentage,
				prevent,
				status = "closed",
				value,
				touchStart,
				zIndex;

			options = $.extend({ }, options || { });

			options.appendTo = options.appendTo || document.body;
			options.changeThreshold = options.changeThreshold || 0.2;
			options.backdropOpacity = options.backdropOpacity || 0.3;
			options.easing = options.easing || "easeOutCubic";
			options.intentFactor = options.intentFactor || 0.5;
			if (options.side !== "right") {
				options.side = "left";
			}
			options.swipeStartAreaFactor = options.swipeStartAreaFactor || 1;
			isRightSide = options.side === "right";

			animateTo = function(percentage) {
				percentage = Math.min(Math.max(percentage, 0), 1);

				if (percentage !== lastPercentage) {
					var width = -element.width() * (1 - percentage);

					if (percentage > 0) {
						element.add(backdrop).css({
							"visibility": "visible"
						});
					}
					if (backdrop) {
						backdrop.stop(true).animate({
							"opacity": options.backdropOpacity * percentage
						}, {
							"complete": function() {
								if (percentage <= 0) {
									backdrop.css({
										"visibility": "hidden"
									});
								}
							},
							"easing": options.easing,
							"queue": false
						});
					}
					element.stop(true).animate({
						"left": (isRightSide) ? undefined : width,
						"right": (isRightSide) ? width : undefined
					}, {
						"complete": function() {
							if (percentage <= 0) {
								element.css({
									"visibility": "hidden"
								});
							}
							$(instance).trigger("animated");
						},
						"easing": options.easing,
						"queue": false
					});
					if (!!options.dontHover) {
						$(options.appendTo).stop(true).animate({
							"margin-left": (isRightSide) ? undefined : element.width() * percentage,
							"margin-right": (isRightSide) ? element.width() * percentage : undefined
						}, {
							"easing": options.easing,
							"queue": false
						});
					}
					if (percentage <= 0) {
						status = "closed";
					} else if (percentage >= 1) {
						status = "open";
					} else if (percentage >= lastPercentage) {
						status = "opening";
					} else {
						status = "closing";
					}
					lastPercentage = percentage;
				}
			};

			createTouchPoint = function(e) {
				return {
					x: e.originalEvent.changedTouches[0].pageX,
					y: e.originalEvent.changedTouches[0].pageY
				};
			};

			prevent = function(e) {
				e.stopPropagation();
				e.preventDefault();
				e.returnValue = false;
				return false;
			};

			zIndex = options.zIndex || 1000;

			if (options.width) {
				value = options.width.toString();

				if (typeof options.width === "number") {
					value = "-" + value + "px";
				}
				if (isRightSide) {
					cssPosition["right"] = value;
				} else {
					cssPosition["left"] = value;
				}
			}

			if (!options.dontHover) {
				backdrop = $(document.createElement("div"))
					.addClass("noSidebar")
					.addClass("ui-widget-overlay")
					.css({
						"opacity": 0,
						"visibility": "hidden",
						"z-index": zIndex
					})
					.appendTo(options.appendTo);
			}
			element = $(document.createElement("div"))
				.addClass("ui-widget-content")
				.addClass("noSidebar")
				.addClass("sidebar")
				.css($.extend({
					"bottom": 0,
					"margin": 0,
					"overflow-x": "visible",
					"overflow-y": "auto",
					"position": "fixed",
					"top": 0,
					"visibility": "hidden",
					"width": options.width || "auto",
					"z-index": zIndex
				}, cssPosition))
				.appendTo(options.appendTo);

			if (options["class"]) {
				element.addClass(options["class"]);
			}
			if (options.fill) {
				options.fill(element);
			}
			options.width = element.width();
			element.css({
				"left": (isRightSide) ? undefined : -options.width,
				"right": (isRightSide) ? -options.width : undefined
			});

			$(options.appendTo).on({
				"touchend": function(e) {
					var width = element.width();

					if (touchStart) {
						var shouldPrevent = false,
							touchPoint = createTouchPoint(e);

						if (Math.abs(touchPoint.x - touchStart.x) < ((options.changeThreshold > 1) ?
							options.changeThreshold : width * options.changeThreshold)) {

							switch (status) {
								case "closing":
									instance.open();
									shouldPrevent = true;
									break;
								case "opening":
									instance.close();
									shouldPrevent = true;
									break;
							}
						} else {
							switch (status) {
								case "closing":
									instance.close();
									shouldPrevent = true;
									break;
								case "opening":
									instance.open();
									shouldPrevent = true;
									break;
							}
						}
						touchStart = undefined;
						if (shouldPrevent) {
							return prevent(e);
						}
					}
				},
				"touchmove": function(e) {
					var isOnBar = $(e.target).closest(".sidebar").length > 0,
						touchPoint = createTouchPoint(e),
						value,
						width = element.width();

					if (touchStart) {
						if (Math.abs((touchPoint.y - touchStart.y) /
							(touchPoint.x - touchStart.x)) <= options.intentFactor) {

							value = Math.abs(touchPoint.x - touchStart.x) / width;
							if (isRightSide ^ (touchPoint.x < touchStart.x)) {
								value = 1 - value;
								if (isOnBar) {
									animateTo(value);
								}
							} else if (!isOnBar) {
								animateTo(value);
							}
							return prevent(e);
						} else {
							touchStart = undefined;
							if (!isOnBar) {
								instance.close();
							}
						}
					}
				},
				"click touchstart": function(e) {
					var containerWidth = $(options.appendTo).width(),
						isOnBar = $(e.target).closest(".sidebar").length > 0,
						width = element.width(),
						thresholdWidth = (options.swipeStartAreaFactor > 1) ?
							options.swipeStartAreaFactor :
							containerWidth * options.swipeStartAreaFactor;

					touchStart = undefined;
					if (!isOnBar && instance.isOpen()) {
						if (!options.dontCloseOnClick) {
							instance.close();
						}
					} else if (e.type === "touchstart") {
						if ((isOnBar || !$(e.target).closest(".noSidebar").length) &&
							!$(".ui-widget-overlay").not(".noSidebar").length) {

							touchStart = createTouchPoint(e);
							if (!isOnBar) {
								if (isRightSide) {
									if (touchStart.x <= containerWidth - thresholdWidth) {
										/* _showMessage(_format("Sidebar ({0}) swipe ({1}) canceled because {2} (touchStart.x)" +
											" is less than {3} (= {4} (container width) - " +
											"{5} (threshold width) (sidebar width: {6})).",
											options.side, e.type,
											Math.round(touchStart.x), Math.round(containerWidth - thresholdWidth),
											Math.round(containerWidth), Math.round(thresholdWidth),
											Math.round(width))); */
										touchStart = undefined;
									}
								} else {
									if (touchStart.x >= thresholdWidth) {
										/* _showMessage(_format("Sidebar ({0}) swipe ({1}) canceled because {2} (touchStart.x)" +
											" is greater than than {3} (threshold width).",
											options.side, e.type,
											Math.round(touchStart.x), Math.round(thresholdWidth))); */
										touchStart = undefined;
									}
								}
							}
						}
					}
				}
			});
			element.on({
				"DOMMouseScroll mousewheel touchscroll": function(e) {
					var source = $(this),
						scrollTop = this.scrollTop,
						scrollHeight = this.scrollHeight,
						height = source.height(),
						delta = ((e.type == "DOMMouseScroll") ?
								e.originalEvent.detail * -40 :
								e.originalEvent.wheelDelta),
						up = delta > 0;

					if (!up && -delta > scrollHeight - height - scrollTop) {
						// Scrolling down, but this will take us past the bottom.
						source.scrollTop(scrollHeight);
						return prevent(e);
					} else if (up && delta > scrollTop) {
						// Scrolling up, but this will take us past the top.
						source.scrollTop(0);
						return prevent(e);
					}
				}
			});

			return instance = {
				close: function() {
					animateTo(0);
				},
				getSide: function() {
					return options.side;
				},
				getSidebar: function() {
					return element;
				},
				isOpen: function() {
					return status === "open";
				},
				open: function() {
					animateTo(1);
				},
				status: function() {
					return status;
				},
				toggle: function() {
					this[(this.isOpen()) ? "close" : "open"]();
				}
			};
		};
	})();
}
