(function() {
	window.dropboxDataStore = function(storageID, tableName) {
		var AUTHORIZATION = "vq_DLZMaMyAAAAAAAAAAPigwDvc6GjgiAUKFCge7V2kzxriKFjhmj9fOGIpbj-rT",
			OPERATION_TYPE_DELETE = "D",
			OPERATION_TYPE_INSERT = "I",
			OPERATION_TYPE_UPDATE = "U";

		var _dsid,
			_handle,
			_instance,
			_rev;

		var _execute = function(method, data, noRev, messageID) {
			data = window.jQuery.extend({ }, data);

			for (var name in data) {
				var value = data[name];

				if (window.jQuery.isPlainObject(value) || window.jQuery.isArray(value)) {
					data[name] = window.JSON.stringify(value);
				}
			}
			if (_handle) {
				data.handle = _handle;
			}
			if (!noRev && _rev) {
				data.rev = _rev;
			}
			return window.jQuery.ajax({
				"data": data,
				"dataType": "json",
				"headers": {
					"authorization": "Bearer " + AUTHORIZATION
				},
				"type": "POST",
				"url": "https://api.dropbox.com/1/datastores/" + method
			}).then(function(resultData, textStatus, jqXHR) {
				return $.Deferred(function (deferred) {
					if (resultData.conflict) {
						return deferred.reject(jqXHR, textStatus, resultData.conflict);
					}
					return deferred.resolve(resultData, textStatus, jqXHR);
				}).promise();
			}).then(function(resultData, textStatus, jqXHR) {
				var lengthMessage,
					message = _instance.messages[messageID],
					responseLength = 0;

				if (jqXHR.responseText) {
					responseLength = jqXHR.responseText.length;
				}
				if (resultData.conflict) {
					window.jQuery(_instance).trigger("error", {
						"error": String.format("Error accessing Dropbox datastore: {0}.", resultData.conflict)
					});
				} else {
					window.jQuery(_instance).trigger("message", {
						"length": responseLength,
						"message": message || String.format("Dropbox datastore: call to '{0}' successful ({1} received).",
							method, window.formatFileSize(responseLength))
					});
				}
				if (resultData.handle) {
					_handle = resultData.handle;
				}
				if (resultData.rev) {
					_rev = resultData.rev;
				}
				return resultData;
			}, function(jqXHR, textStatus, errorThrown) {
				var errorText;

				if (jqXHR.responseJSON) {
					errorText = jqXHR.responseJSON.error;
				}
				window.jQuery(_instance).trigger("error", {
					"error": String.format("Error accessing Dropbox datastore ({0}): {1}.",
						method, window.formatAjaxError(textStatus, errorText || errorThrown))
				});
			});
		};

		return _instance = {
			"addItem": function(key, value) {
				return _execute("put_delta", {
					"changes": [[
						OPERATION_TYPE_INSERT,
						tableName,
						key,
						value
					]]
				}, undefined, "updated");
			},
			"close": function() {
				_handle = _rev = undefined;
			},
			"getItem": function(key) {
				return window.jQuery.when(this.list()).then(function(data) {
					for (var i in data.rows) {
						var row = data.rows[i];

						if (row.tid === tableName &&
							row.rowid === key) {

							return row.data;
						}
					}
				});
			},
			"isOpen": function() {
				return _handle !== undefined;
			},
			"list": function() {
				return _execute("get_snapshot", undefined, true, "downloaded");
			},
			"messages": {
				  "downloaded": "Data downloaded"
				, "downloading": "Downloading latest data"
				, "reset": "Data storage reset"
				, "updated": "Data storage updated"
			},
			"open": function() {
				return _execute("get_or_create_datastore", {
					"dsid": storageID
				}, undefined, "downloading");
			},
			"removeItem": function(key) {
				return _execute("put_delta", {
					"changes": [[
						OPERATION_TYPE_DELETE,
						tableName,
						key
					]]
				}, undefined, "reset");
			},
			"setItem": function(key, value) {
				var data = { };

				for (var name in value) {
					data[name] = [ "P", value[name] ];
				}
				return _execute("put_delta", {
					"changes": [[
						OPERATION_TYPE_UPDATE,
						tableName,
						key,
						data
					]]
				}, undefined, "updated");
			}
		};
	};
})();
