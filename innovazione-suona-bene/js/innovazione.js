"use strict";

(function() {
	var audio = {
		"Cervello": { url: "audio/cervello.mp3" },
		"Cuore": { url: "audio/cuore.mp3" },
		"Muscoli": { url: "audio/muscoli.mp3" },
		"Ossa": { url: "audio/ossa.mp3" },
		"Polmoni": { url: "audio/polmoni.mp3" },
		"Seno": { url: "audio/seno.mp3" },
		"Utero": { url: "audio/utero.mp3" }
	}, tracks = {
		duration: 0,
		tracks: 0
	};

	var context,
		es = function(className) { return Array.from(document.getElementsByClassName(className)); };

	var plays = function(callback) { es("play").forEach(function(e) { callback(e); }); };
	var stops = function(callback) { es("stop").forEach(function(e) { callback(e); }); };

	plays(function(button) { button.disabled = true; });
	stops(function(button) { button.disabled = true; });

	var grid = Array.from(document.getElementsByClassName("grid")).pop();

	var load = function(item) {
		var failed = function(e) {
			item.element.innerText = item.name + ": " + e.message;
			item.element.classList.add("error");
		};

		return fetch(item.url).then(function(response) {
			if (!context) {
				context = new AudioContext();
				context.suspend();
			}

			return response.arrayBuffer().then(function(arrayBuffer) {
				return context.decodeAudioData(arrayBuffer).then(function(buffer) {
					tracks.duration = Math.max(tracks.duration, buffer.duration);

					var source = context.createBufferSource();

					var gain = context.createGain();

					source.connect(gain);

					/* if (item.name === "Cervello") {
						var oscillator = context.createOscillator();

						oscillator.type = "sine";
						oscillator.frequency.value = 20;

						oscillator.connect(gain);
						oscillator.frequency.linearRampToValueAtTime(20, 3);
						oscillator.start();
					} */

					gain.connect(context.destination);

					source.buffer = buffer;
					source.loop = true;
					item.element.innerText = item.name;
					item.element.addEventListener("click", function(_) {
						if (gain.gain.value === 0) {
							gain.gain.value = 1;
							item.element.classList.remove("muted");
						} else {
							gain.gain.value = 0;
							item.element.classList.add("muted");
						}
					});
					source.start();
					item.source = source;
					tracks[item.name] = item;
					tracks.tracks++;
				}).catch(failed);
			}).catch(failed);
		}).catch(failed);
	};

	es("start").forEach(function(e) {
		e.addEventListener("click", function() {
			var loads = [];

			es("start").forEach(function(s) { s.innerText = "..."; });
			Object.keys(audio).forEach(function(name) {
				var e = document.createElement("button");

				e.setAttribute("type", "button");
				e.classList.add("audio");

				var item = audio[name];

				item.name = name;
				item.element = e;
				loads.push(load(item));
				e.innerText = "Caricamento di '" + name + "'...";
				grid.appendChild(e);
			});
			Promise.all(loads).then(function() {
				es("position").forEach(function(e) { e.max = Math.ceil(tracks.duration * 1e2); });
				plays(function(button) {
					button.disabled = false;
					button.addEventListener("click", function(_) {
						context.resume();
						plays(function(e) { e.disabled = true; });
						stops(function(e) { e.disabled = false; });
					});
				});
				stops(function(button) {
					button.addEventListener("click", function(_) {
						context.suspend();
						plays(function(e) { e.disabled = false; });
						stops(function(e) { e.disabled = true; });
					});
				});
				setTimeout(function() { es("play").pop().click(); }, 1e3);
			}).finally(function() {
				es("backdrop").concat(es("starter")).forEach(function(_) { _.style.display = "none"; });
			});
		});
	});

	window.setInterval(function() {
		if (context) {
			Array.from(document.getElementsByClassName("position")).forEach(function(e) {
				e.value = Math.floor(context.currentTime % tracks.duration * 1e2);
			});
		}
	}, 25);
})();

/* (() => {
	const go = async () => {
		const context = new AudioContext();

		const response = await fetch("audio/loop.mp3");

		const buffer = await context.decodeAudioData(await response.arrayBuffer());

		// const duration = Math.floor(buffer.duration);

		const source = context.createBufferSource();

		source.connect(context.destination);
		source.buffer = buffer;
		source.loop = true;
		//source.loopEnd = /
		source.start();
	};

	document.addEventListener("click", (e) => {
		if (e.which === 3) {
			go();
		}
	});

	document.addEventListener("keydown", (e) => {
		switch (e.which) {
			case 13:	/* Enter *//*
				go();
				break;
		}
	});
})(); */