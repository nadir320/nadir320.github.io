(function() {
	window.firebaseDataStore8 = function(apiKey, storageID) {
		var DATA_OVERHEAD_FACTOR = 1.04;

		var _application,
			_auth,
			_customToken,
			_error = function(deferred, error) {
				if (error && !error.length && error.toString) {
					error = error.toString();
				}
				window.jQuery(_instance).trigger("error", {
					error: String.format("Error accessing Firebase data-store {0}{1}",
						storageID, (error && error.length) ? String.format(": {0}", error) : ".")
				});
				deferred.reject(error);
			},
			_execute = function(fn) {
				return window.jQuery.Deferred(function(deferred) {
					var timeout = window.setTimeout(function() {
						_error(deferred);
					}, _instance.timeout || 2 * window.jQuery.ajaxSetup().timeout);

					try {
						return fn(function(data, messageID, method, responseLength) {
							window.clearTimeout(timeout);
							_message(messageID, method, responseLength);
							deferred.resolve(data);
						}, function(error, noError) {
							window.clearTimeout(timeout);
							if (noError) {
								deferred.reject();
							} else {
								_error(deferred, error);
							}
						});
					} catch (e) {
						window.clearTimeout(timeout);
						_error(deferred, e);
					}
				}).promise();
			},
			_firebase,
			_instance,
			_message = function(messageID, method, responseLength) {
				window.jQuery(_instance).trigger("message", {
					length: responseLength,
					message: _instance.messages[messageID] ||
						String.format("Firebase data-store: call to '{0}' successful ({1} received).",
							method, window.formatFileSize(responseLength))
				});
			},
			_open = function(doneCallback, errorCallback) {
				var authenticationParameters = [ ],
					auth,
					method;

				if (_customToken && _customToken.length) {
					if (!_tokenGenerator) {
						_tokenGenerator = new FirebaseTokenGenerator(_customToken);
					}
					authenticationParameters.push(_tokenGenerator.createToken({
						uid: window.jQuery.now()
					}));
					method = "signInWithCustomToken";
				} else if (_username && _username.length &&
					_password && _password.length) {
					authenticationParameters.push(_username);
					authenticationParameters.push(_password);
					method = "signInWithEmailAndPassword";
				} else {
					method = "signInAnonymously";
				}
				_auth[method].apply(_auth, authenticationParameters)
					.then(function(user) {
						/* _auth.currentUser.getIdTokenResult().then((a) => { debugger; }); */
						doneCallback(_firebase = _application.database());
					}, function(error) {
						errorCallback(error);
					});
			},
			_tokenGenerator,
			_url = {
				authDomain: "{0}.firebaseapp.com".format(storageID),
				rootURL: "https://{0}.firebaseio.com/".format(storageID),
				storageBucket: "{0}.appspot.com".format(storageID)
			},
			_username;

		_auth = (_application = firebase.initializeApp({
			apiKey: apiKey,
			authDomain: _url.authDomain,
			databaseURL: _url.rootURL,
			storageBucket: _url.storageBucket,
		}, window.guid())).auth();

		return _instance = {
			addItem: function(key, value) {
				if (key) {
					return _instance.setItem(key, value);
				} else {
					if (value === undefined) {
						value = null;
					}
					if (value !== null) {
						return _execute(function(doneCallback, errorCallback) {
							var result = _firebase.push(value, function(error) {
								if (error) {
									errorCallback();
								} else {
									doneCallback(result.key, "updated", "push", -1);
								}
							});
						});
					} else {
						return _instance.removeItem(key);
					}
				}
			},
			/*changePassword: function(username, oldPassword, newPassword) {
				return _execute(function(doneCallback, errorCallback) {
					_message("changingPassword");
					_auth.changePassword({
						email: (username || "").toLowerCase(),
						oldPassword: oldPassword,
						newPassword: newPassword
					}, function(error) {
						var message;

						if (error) {
							switch (error.code) {
								case "INVALID_PASSWORD":
									message = _instance.messages["invalidPassword"];
									break;
								case "INVALID_USER":
									message = _instance.messages["invalidUsername"];
									break;
							}
							errorCallback(message || error.message);
						} else {
							doneCallback(undefined, "passwordChanged", "changePassword", -1);
						}
					});
				});
			},*/
			getItem: function(key, list) {
				if (list) {
					var child,
						path = key.split("/");

					if (path.length > 1) {
						key = path.pop();
						child = path.join("/");
					}
					return window.jQuery.when(this.list(child)).then(function(data) {
						return data[key];
					});
				}
				return _execute(function(doneCallback, errorCallback) {
					_application.database()
						.refFromURL(_url.url + key + "/")
						.once("value").then(function(snapshot) {
							if (snapshot.exists()) {
								var value = snapshot.val() || { };

								doneCallback(value, "downloaded", "value",
									window.JSON.stringify(value).length * DATA_OVERHEAD_FACTOR);
							} else {
								errorCallback();
							}
						}, function(e) {
							errorCallback(e);
						});
				});
			},
			getItems: function(items) {
				return _execute(function(doneCallback, errorCallback) {
					var values = [ ];

					window.jQuery.when.apply(_application.database().ref(),
						window.jQuery.map(items, function(item, i) {
							return window.jQuery.Deferred(function(deferred) {
								_application.database().refFromURL(_url.url + item + "/").once("value")
									.then(function(data) {
										values[i] = data.val();
										deferred.resolve();
									}, deferred.reject);
							}).promise();
					})).always(function() {
						doneCallback(values, "downloaded", "value",
							window.JSON.stringify(values).length * DATA_OVERHEAD_FACTOR);
					});
				});
			},
			hasItem: function(key) {
				return _execute(function(doneCallback, errorCallback) {
					_application.database()
						.refFromURL(_url.url + key + "/")
						.once("value").then(function(snapshot) {
							if (snapshot.exists()) {
								var value = snapshot.val() || { };

								doneCallback(value, "downloaded", "value",
									window.JSON.stringify("value").length * DATA_OVERHEAD_FACTOR);
							} else {
								errorCallback(undefined, true);
							}
						}, function(e) {
							errorCallback(e);
						});
				});
			},
			close: function() {
				_firebase = null;
			},
			isOpen: function() {
				return !!_firebase;
			},
			list: function(child) {
				return _execute(function(doneCallback, errorCallback) {
					var firebase = _firebase;

					if (child && child.length) {
						firebase = firebase.child(child);
					}
					firebase.once("value").then(function(snapshot) {
						if (snapshot.exists) {
							var value = snapshot.val() || { };

							doneCallback(value, "downloaded", "value",
								window.JSON.stringify(value).length * DATA_OVERHEAD_FACTOR);
						} else {
							errorCallback(undefined, true);
						}
					}, function(e) {
						errorCallback(e);
					});
				});
			},
			messages: {
				  changingPassword: "Changing password..."
				, connected: "Connected"
				, connecting: "Connecting..."
				, downloaded: "Data downloaded"
				, downloading: "Downloading latest data"
				, invalidPassword: "Invalid password"
				, invalidUsername: "Invalid user name"
				, passwordChanged: "Password changed successfully"
				, reset: "Data storage reset"
				, updated: "Data storage updated"
			},
			open: function(username, password, customToken, child) {
				var url = _url.rootURL;

				_customToken = customToken;
				_username = (username || "").toLowerCase();
				_password = password;
				if (child) {
					url += child + "/";
				}
				return _execute(function(doneCallback, errorCallback) {
					_message("connecting");
					_open(function() {
						_firebase = _firebase.refFromURL(_url.url = url);
						doneCallback(undefined, "downloading", "open", -1);
					}, errorCallback);
				});
			},
			removeItem: function(key) {
				return _instance.setItem(key, null);
			},
			setItem: function(key, value) {
				if (value === undefined) {
					value = null;
				}
				return _execute(function(doneCallback, errorCallback) {
					_application.database()
						.refFromURL(_url.url + key + "/")
						.set(value)
						.then(function(error) {
							if (error) {
								errorCallback();
							} else {
								doneCallback(undefined, (value) ?
									"updated" : "reset", "set", -1);
							}
						});
				});
			}
		};
	};
	window.firebaseDataStore8.cleanup = function(interval) {
		var ONE_DAY = 24 * 60 * 60 * 1000;

		var entry,
			toRemove;

		if (window.localStorage && window.localStorage.removeItem) {
			interval = interval || ONE_DAY;
			now = window.jQuery.now();
			toRemove = [ ];

			for (var name in window.localStorage) {
				if (name.match(/firebase:authUser:*./i)) {
					if ((entry = window.localStorage[name]) && entry.length) {
						entry = window.jQuery.parseJSON(entry);
						if (entry.stsTokenManager && entry.stsTokenManager.expirationTime) {
							try {
								if (now - new Date(entry.stsTokenManager.expirationTime).getTime() >= interval) {
									toRemove.push(name);
								}
							} catch (e) { }
						}
					}
				}
			}
			for (var i = 0; i < toRemove.length; i++) {
				window.localStorage.removeItem(toRemove[i]);
			}
		}
	};
	window.firebaseDataStore8.getKey = function(name) {
		return name.replace(/(\.|\#|\$|\/|\[|\]|\@)/g, "_");
	};
})();
