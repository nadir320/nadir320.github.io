"use strict";

if (window.jQuery) {
	(function() {
		var __dataName = "scroller",
			__class = "ui-" + __dataName + "-panel",
			__downClassName = "ui-" + __dataName + "-downButton",
			__upClassName = "ui-" + __dataName + "-upButton";

		var __css = {
				position: "fixed",
				height: "2.2em",
				margin: "inherit",
				right: "1em",
				width: "2.2em"
			},
			__downCSS = {
				top: "1em"
			},
			__upCSS = {
				bottom: "1em"
			};

		var __refreshButtons = function(e) {
			var target = window.jQuery(e.target),
				instance = target.scroller("instance");

			if (instance.downButton) {
				instance.downButton[(target.scrollTop() < e.target.scrollHeight - target.innerHeight()) ?
					(instance.options.animate) ? "fadeIn" : "show" :
					(instance.options.animate) ? "fadeOut" : "hide"]();
			}
			if (instance.upButton) {
				instance.upButton[(target.scrollTop() > 0) ?
					(instance.options.animate) ? "fadeIn" : "show" :
					(instance.options.animate) ? "fadeOut" : "hide"]();
			}
		};

		window.jQuery.widget("." + __dataName, {
			options: {
				animate: true,
				buttonTagName: "button",
				downButtonIcon: "ui-icon-arrowthickstop-1-s",
				downButtonStyle: { },
				scrollDown: true,
				scrollUp: true,
				upButtonStyle: { },
				upButtonIcon: "ui-icon-arrowthickstop-1-n"
			},
			_create: function() {
				if (this.options.scrollDown) {
					this.downButton = window.jQuery(document.createElement(this.options.buttonTagName))
						.button({
							icons: { primary: this.options.downButtonIcon },
							text: false
						})
						.addClass(__downClassName)
						.css(window.jQuery.extend({ }, __css, __downCSS, this.options.downButtonStyle))
						.hide()
						.on({
							"click": function(e) {
								var element = window.jQuery(e.target).closest("." + __class),
									instance = element.data(__dataName);

								e.preventDefault();
								if (instance.options.animate) {
									element.animate({
										scrollTop: element[0].scrollHeight - element.innerHeight()
									});
								} else {
									element.scrollTop(element[0].scrollHeight - element.innerHeight());
								}
							}
						})
						.appendTo(this.element);
				}
				if (this.options.scrollUp) {
					this.upButton = window.jQuery(document.createElement(this.options.buttonTagName))
						.button({
							icons: { primary: this.options.upButtonIcon },
							text: false
						})
						.addClass(__upClassName)
						.css(window.jQuery.extend({ }, __css, __upCSS, this.options.upButtonStyle))
						.hide()
						.on({
							"click": function(e) {
								var element = window.jQuery(e.target).closest("." + __class),
									instance = element.data(__dataName);

								e.preventDefault();
								if (instance.options.animate) {
									element.animate({
										scrollTop: 0
									});
								} else {
									element.scrollTop(0);
								}
							}
						})
						.appendTo(this.element);
				}

				if (!this.element.hasClass(__class)) {
					this.element.addClass(__class);
				}
				if (!this.element.data(__dataName)) {
					this.element.data(__dataName, this);
				}
				this.element.on("scroll", __refreshButtons);
			},
			_destroy: function() {
				this.element
					.removeClass(__class)
					.removeData(__dataName);
				this.element.off("scroll", __refreshButtons);
				if (this.downButton) {
					this.downButton.off().remove();
				}
				if (this.upButton) {
					this.upButton.off().remove();
				}
			},
			refresh: function() {
				__refreshButtons({
					target: this.element
				});
			}
		});
	})();
}
