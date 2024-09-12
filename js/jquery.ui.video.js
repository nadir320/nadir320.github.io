"use strict";

if (window.jQuery && window.jQuery.ui) {
	(function() {
		var __TIMER_INTERVAL = 100;

		var _find = function(what, e) {
			return window.jQuery(_getVideo(e))
				.closest(".ui-video")
				.find(what);
		}

		var _getDurationText = function(duration) {
			var minutes, seconds;

			if (duration !== undefined && !isNaN(duration)) {
				minutes = Math.floor(duration / 60);
				if ((seconds = Math.ceil(duration % 60)) === 60) {
					seconds = 0;
					minutes++;
				}
				minutes = minutes.toLocaleString();
				seconds = seconds.toLocaleString();
				if (minutes.length < 2) {
					minutes = 0..toLocaleString() + minutes;
				}
				if (seconds.length < 2) {
					seconds = 0..toLocaleString() + seconds;
				}
			} else {
				minutes = seconds = "--";
			}
			return minutes + ":" + seconds;
		};

		var _getVideo = function(e) {
			if (!e) {
				e = this;
			}
			if (e.target) {
				e = e.target;
			}
			return window.jQuery(e)
				.closest(".ui-video")
				.find("video")
				.first()[0];
		};

		var _hasAudio = function(video) {
			return (video = _getVideo(video)).mozHasAudio ||
				!!video.webkitAudioDecodedByteCount ||
				!!(video.audioTracks && video.audioTracks.length);
		};

		var _playClick = function(video) {
			video = _getVideo(video);

			var jVideo = window.jQuery(video);

			if (jVideo.data("__rateIncreased")) {
				jVideo.removeData("__rateIncreased");
			} else if (video.paused) {
				video.play();
			} else {
				video.pause();
				_find(".play-button", video).fadeIn();
			}
		};

		var _requestFullScreen = function(video) {
			try {
				((video = _getVideo(video)).requestFullscreen ||
					video.mozRequestFullScreen ||
					video.webkitRequestFullscreen ||
					(function() { })).call(video);
			} catch (e) { }
		};

		var _startRateTimer = function(video) {
			video = _getVideo(video);
			if (!video.paused) {
				window.jQuery(video)
					.data("__rateTimer", window.setTimeout(function() {
						window.jQuery(video).data("__rateIncreased", 1);
						_find(".rate-label", video).fadeIn();
						video.playbackRate = 2;
					}, 5 * __TIMER_INTERVAL));
			}
		};

		var _stopRateTimer = function(video) {
			window.clearTimeout(window.jQuery(video = _getVideo(video))
				.data("__rateTimer"));
			_find(".rate-label", video).fadeOut();
			video.playbackRate = 1;
		};

		var _startUpdateTimer = function(video) {
			window.jQuery(video = _getVideo(video))
				.data("__updateTimer", window.setInterval(function() {
					_update(video);
				}, __TIMER_INTERVAL));
			_find(".video-play", video).addClass("pause");
		};

		var _stopUpdateTimer = function(video) {
			window.clearInterval(window.jQuery(video = _getVideo(video))
				.data("__updateTimer"));
			_find(".video-play", video).removeClass("pause");
		};

		var _update = function(video, updateVolume) {
			video = _getVideo(video);

			var tracker = _find(".video-position", video)[0],
				volume = _find(".video-volume", video),
				volumeButton = _find(".video-volume-toggle", video);

			if (_hasAudio(video)) {
				volumeButton.prop("disabled", false);
				volumeButton[(video.muted) ?
					"addClass" :
					"removeClass"]("muted");
				volume.prop("disabled", false);
				if (video.volume && updateVolume) {
					volume.val(Math.ceil(video.volume * 100));
				}
			} else {
				volumeButton
					.addClass("muted")
					.prop("disabled", true);
				volume.prop("disabled", true);
			}
			if (!isNaN(window.parseFloat(video.duration)) &&
				!isNaN(window.parseFloat(video.currentTime))) {

				tracker.max = Math.ceil(video.duration);
				tracker.value = Math.ceil(video.currentTime);
			}
			_find(".video-duration", video).text(_getDurationText(video.currentTime) +
				"/"  + _getDurationText(video.duration));
			_find(".video-loop", video)[(video.loop) ?
				"addClass" :
				"removeClass"]("looping");
		};

		window.jQuery.fn.video = function(command) {
			return window.jQuery(this).each(function(i, item) {
				var container;

				item = window.jQuery(item);
				if ((command || "").toLowerCase() === "destroy") {
					container = item.off(".uiVideo").parent();
					container.replaceWith(item);
					container.empty();
				} else if ((command || "").toLowerCase() === "update") {
					_update(item, true);
				} else if (item.is("video") && !item.data("isVideo")) {
					item[0].controls = null;
					item.data({
						"isVideo": true
					}).replaceWith(container = window.jQuery(document.createElement("div"))
						.addClass("ui-video"));
					container
						.append(item
							.on({
								"durationchange.uiVideo": function(e) {
									_update(e, true);
								},
								"click.uiVideo": function(e) {
									_stopRateTimer(e);
									_playClick(e);
								},
								"mousedown.uiVideo": function(e) {
									if (e.which === 1) {
										_startRateTimer(e);
									}
								},
								"touchstart.uiVideo": function(e) {
									window.jQuery(_getVideo(e)).removeData("__rateIncreased");
									_startRateTimer(e);
								},
								"mouseup.uiVideo": function(e) {
									if (e.which === 1) {
										_stopRateTimer(e);
									}
								},
								"touchend.uiVideo": function(e) {
									if (window.jQuery(_getVideo(e)).data("__rateIncreased")) {
										e.preventDefault();
									}
									_stopRateTimer(e);
								},
								"pause.uiVideo": function(e) {
									_stopUpdateTimer(e);
								},
								"play.uiVideo": function(e) {
									_find(".play-button", e).fadeOut();
									_find(".video-position", e).prop("disabled", false);
									_startUpdateTimer(e);
								},
								"timeupdate.uiVideo": function(e) {
									_update(e, true);
								}
							}))
						.append(window.jQuery(document.createElement("button"))
							.attr({
								"type": "button"
							})
							.addClass("play-button")
							.on({
								"click": function(e) {
									_getVideo(e).play();
								}
							}))
						.append(window.jQuery(document.createElement("div"))
							.addClass("rate-label")
							.append(window.jQuery(document.createElement("div"))
								.text("2x"))
							.hide())
						.append(window.jQuery(document.createElement("div"))
							.addClass("ui-widget-header")
							.addClass("video-toolbar")
							.append(window.jQuery(document.createElement("button"))
								.addClass("video-button")
								.addClass("video-play")
								.attr({
									"type": "button"
								})
								.on({
									"click": function(e) {
										_playClick(e);
									}
								}))
							.append(window.jQuery(document.createElement("input"))
								.addClass("video-track")
								.addClass("video-position")
								.attr({
									"max": 1,
									"min": 0,
									"type": "range"
								})
								.prop("disabled", true)
								.on({
									"mousedown touchstart": function(e) {
										e.stopPropagation();
									}, "change click input": function(e) {
										try {
											_getVideo(e).currentTime = e.target.value;
											window.jQuery(item).trigger("positionchanged");
										} catch (ex) { }
										e.stopPropagation();
									}
								})
								.val(0))
							.append(window.jQuery(document.createElement("span"))
								.addClass("video-duration"))
								.css({
									"width": item.width()
								})
							.append(window.jQuery(document.createElement("button"))
								.addClass("video-button")
								.addClass("video-fullscreen")
								.attr({
									"type": "button"
								})
								.on({
									"click": function(e) {
										_requestFullScreen(e);
									}
								}))
							.append(window.jQuery(document.createElement("button"))
								.addClass("video-button")
								.addClass("video-loop")
								.attr({
									"type": "button"
								})
								.on({
									"click": function(e) {
										var video = _getVideo(e);

										video.loop = !video.loop;
										window.jQuery(item).trigger("loopchanged");
										_update(e, true);
									}
								}))
							.append(window.jQuery(document.createElement("input"))
								.addClass("video-track")
								.addClass("video-volume")
								.attr({
									"max": 100,
									"min": 0,
									"type": "range"
								})
								.prop("disabled", true)
								.on({
									"mousedown touchstart": function(e) {
										e.stopPropagation();
									}, "change click input": function(e) {
										try {
											_getVideo(e).volume = e.target.value / 100;
											window.jQuery(item).trigger("volumechanged");
										} catch (ex) { }
										e.stopPropagation();
									}
								})
								.val(0))
							.append(window.jQuery(document.createElement("button"))
								.addClass("video-button")
								.addClass("video-volume-toggle")
								.attr({
									"type": "button"
								})
								.on({
									"click": function(e) {
										var video = _getVideo(e);

										video.muted = !video.muted;
										window.jQuery(item).trigger("mutechanged");
										_update(e, true);
									}
								})));
					_update(item, true);
				}
			});
		};
	})();
}
