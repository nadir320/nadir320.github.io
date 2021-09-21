"use strict";

if (window.jQuery) {
	(function() {
		window.swiper = function(options) {
			var createTouchPoint,
				prevent,
				touchStart;

			options = window.jQuery.extend({ }, options || {
				body: document.body,
				intentFactor: 0.5,
				swipeThreshold: 0.15,
			});

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

			window.jQuery(options.appendTo).on({
				touchend: function(e) {
					var width = window.jQuery(options.appendTo).width();

					if (touchStart && !e.isDefaultPrevented()) {
						var touchPoint = createTouchPoint(e);

						if (Math.abs(touchPoint.x - touchStart.x) > ((options.swipeThreshold > 1) ?
							options.swipeThreshold : width * options.swipeThreshold)) {

							if (touchPoint.x > touchStart.x) {
								if (options.swipeRight) {
									options.swipeRight();
								}
							} else if (options.swipeLeft) {
								options.swipeLeft();
							}
						}
					}
					touchStart = undefined;
				},
				touchmove: function(e) {
					var touchPoint = createTouchPoint(e);

					if (touchStart && Math.abs((touchPoint.y - touchStart.y) /
						(touchPoint.x - touchStart.x)) > options.intentFactor) {

						touchStart = undefined;
					}
				},
				touchstart: function(e) {
					touchStart = undefined;
					if (!window.jQuery(e.target).closest(".noSwipe").length) {
						touchStart = createTouchPoint(e);
					}
				}
			});
		};
	})();
}
