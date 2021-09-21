(function() {
	window.firebaseDataStore = function(storageID) {
		var _authenticated,
			_customToken,
			_error = function(deferred, error) {
				window.jQuery(_instance).trigger("error", {
					"error": String.format("Error accessing Firebase data-store {0}{1}",
						storageID, (error && error.length) ? String.format(": {0}", error) : ".")
				});
				deferred.reject(error);
			},
			_execute = function(fn) {
				return window.jQuery.Deferred(function(deferred) {
					var timeout = window.setTimeout(function() {
						_error(deferred);
					}, _instance.timeout || window.jQuery.ajaxSetup().timeout);

					return fn(function(data, messageID, method, responseLength) {
						window.clearTimeout(timeout);
						_message(messageID, method, responseLength);
						deferred.resolve(data);
					}, function(error) {
						window.clearTimeout(timeout);
						_error(deferred, error);
					});
				});
			},
			_firebase,
			_instance,
			_message = function(messageID, method, responseLength) {
				window.jQuery(_instance).trigger("message", {
					"length": responseLength,
					"message": _instance.messages[messageID] ||
						String.format("Firebase data-store: call to '{0}' successful ({1} received).",
							method, window.formatFileSize(responseLength))
				});
			},
			_open = function(url, doneCallback, errorCallback) {
				var authenticationParameters = [ ],
					firebase = new Firebase(url),
					method;

				if (!_authenticated) {
					if (_customToken && _customToken.length) {
						if (!_tokenGenerator) {
							_tokenGenerator = new FirebaseTokenGenerator(_customToken);
						}
						authenticationParameters.push(_tokenGenerator.createToken({
							"uid": window.jQuery.now()
						}));
						method = "authWithCustomToken";
					} else if (_username && _username.length &&
						_password && _password.length) {
						authenticationParameters.push({
							"email": _username,
							"password": _password
						});
						method = "authWithPassword";
					} else {
						method = "authAnonymously";
					}
					authenticationParameters.push(function(error, authData) {
						if (error) {
							errorCallback(error.message);
						} else {
							//_authenticated = true;
							doneCallback(firebase);
						}
					});
					authenticationParameters.push({
						"remember": "none"
					});
					firebase[method].apply(firebase, authenticationParameters);
				}
			},
			_tokenGenerator,
			_url = "https://{0}.firebaseio.com/".format((!isNaN(parseInt(storageID))) ?
				"glowing-fire-{0}".format(storageID) :
				storageID),
			_username;

		return _instance = {
			"addItem": function(key, value) {
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
									doneCallback(result.key(), "updated", "push", -1);
								}
							});
						});
					} else {
						return _instance.removeItem(key);
					}
				}
			},
			"changePassword": function(username, oldPassword, newPassword) {
				return _execute(function(doneCallback, errorCallback) {
					_message("changingPassword");
					_firebase.changePassword({
						"email": (username || "").toLowerCase(),
						"oldPassword": oldPassword,
						"newPassword": newPassword
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
			},
			"getItem": function(key) {
				return window.jQuery.when(this.list()).then(function(data) {
					return data[key];
				});
			},
			"close": function() {
				_firebase = null;
			},
			"isOpen": function() {
				return !!_firebase;
			},
			"list": function() {
				return _execute(function(doneCallback) {
					_firebase.once("value", function(snapshot) {
						var value = snapshot.val() || { };

						doneCallback(value, "downloaded", "value",
							window.JSON.stringify(value).length * 1.04);
					});
				});
			},
			"messages": {
				  "changingPassword": "Changing password..."
				, "connected": "Connected"
				, "connecting": "Connecting..."
				, "downloaded": "Data downloaded"
				, "downloading": "Downloading latest data"
				, "invalidPassword": "Invalid password"
				, "invalidUsername": "Invalid user name"
				, "passwordChanged": "Password changed successfully"
				, "reset": "Data storage reset"
				, "updated": "Data storage updated"
			},
			"open": function(username, password, customToken, child) {
				_customToken = customToken;
				_username = (username || "").toLowerCase();
				_password = password;
				if (child) {
					_url += child + "/";
				}
				return _execute(function(doneCallback, errorCallback) {
					_message("connecting");
					_open(_url, function(firebase) {
						_firebase = firebase;
						doneCallback(undefined, "downloading", "open", -1);
					}, errorCallback);
				});
			},
			"removeItem": function(key) {
				return _instance.setItem(key, null);
			},
			"setItem": function(key, value) {
				if (value === undefined) {
					value = null;
				}
				return _execute(function(doneCallback, errorCallback) {
					_open(_url + key + "/", function(firebase) {
						firebase.set(value, function(error) {
							if (error) {
								errorCallback();
							} else {
								doneCallback(undefined, (value) ?
									"updated" : "reset", "set", -1);
							}
						});
					}, errorCallback);
				});
			}
		};
	};
	window.firebaseDataStore.getKey = function(name) {
		return name.replace(/(\.|\#|\$|\[|\]|\@)/g, "_");
	};
})();
