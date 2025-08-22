"use strict";

window.tumblr = function(auth) {
	var API_URL_FORMAT = "https://api.tumblr.com/v2/blog/{0}/{1}",
		AUDIO_URL_FORMAT = "https://a.tumblr.com/{0}o1.mp3"/*#_=_"*/;

	var API_KEY = auth.api_key,
		SECRET = auth.oauth_secret,
		TOKEN = auth.oauth_token,
		TOKEN_SECRET = auth.oauth_token_secret;

	var _oauth = OAuth({
		"consumer": {
			"key": API_KEY,
			"secret": SECRET
		},
		"signature_method": "HMAC-SHA1",
		"hash_function": function(base_string, key) {
			return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
		}
	});

	var _findTumblrPhotos = function(text) {
		var photos = [ ];

		if (text && text.length) {
			photos = $(document.createElement("div"))
				.html(text
					.replace(/ src="/gi, " data-src=\"")
					.replace(/ srcset="/gi, " data-srcset=\"")
					.replace(/ poster="/gi, " data-poster=\"")
				)
				.find("img")
				.map(function(i, item) {
					var alt_sizes,
						currentWidth,
						height,
						matches,
						photo,
						url = (item = $(item)).data("src"),
						srcSet = item.data("srcset"),
						width;

					if (window.tumblr.isPhotoURL(url, matches = { })) {
						matches = matches.matches;

						height = parseInt(item.data("orig-height")) ||
							parseInt(item.parent().data("orig-height")) || 0;
						width = parseInt(item.data("orig-width")) ||
							parseInt(item.parent().data("orig-width")) || 0;

						alt_sizes = [ photo = {
							"height": height,
							"url": url = window.location.sameProtocol(url),
							"width": width
						} ];

						if (matches &&
							matches.length > 1 &&
							!!(currentWidth = parseInt(matches[matches.length - 1])) &&
							currentWidth !== 1280 &&
							width > currentWidth) {

							photo.width = currentWidth;
							photo.height = Math.floor(photo.height * currentWidth / width);
							if (matches.isPhoto) {
								alt_sizes.push(photo = {
									"height": height,
									"url": url = url.replace("_" + currentWidth + ".", "_1280."),
									"width": width
								});
							}
						}
						if (srcSet && srcSet.length) {
							$(srcSet.split(",")).each(function(j, setItem) {
								let setItemData = setItem.split(" "),
									setItemWidth = setItemData.pop(),
									setItemUrl = window.location.sameProtocol(setItemData.pop()),
									setItemHeight,
									inAltSizes = false;

								if (setItemWidth = parseInt(setItemWidth.substr(0, setItemWidth.length - 1))) {
									for (var k = 0; k < alt_sizes.length; k++) {
										if (alt_sizes[k].width === setItemWidth) {
											inAltSizes = true;
											break;
										}
									}
									if (!inAltSizes) {
										setItemHeight = setItemUrl.split("/");
										setItemHeight.pop();
										setItemHeight = setItemHeight.pop();
										setItemHeight = setItemHeight.split("_")[0];
										setItemHeight = parseInt(setItemHeight.split("x").pop());
										alt_sizes.push({
											"height": setItemHeight,
											"url": setItemUrl,
											"width": setItemWidth
										});
									}
								}
							});
							alt_sizes.sort(_sortImageSizes);
						}
						return {
							"alt_sizes": alt_sizes,
							"download_url": url,
							"original_size": photo,
							"photoID": window.guid()
						};
					}
				});
		}
		return $.makeArray(photos);
	};

	var _getBestFitPhotoIndex = function(photoIndex, width, height) {
		var index, photo = this.photos[photoIndex];

		$(photo.alt_sizes).each(function(i) {
			if (this.width <= width &&
				(!height || (this.height <= height))) {

				index = i;
				return false;
			}
		});
		if (index === undefined) {
			index = photo.alt_sizes.length - 1;
		}
		return index;
	};

	var _getAjaxPage = function(url, data, additionalData) {
		var r = $.Deferred();

		/* while (url.length && url[url.length - 1] === "/") {
			url = url.substr(0, url.length - 1);
		} */

		var ajaxFn = function() {
			return $.Deferred(function(deferred) {
				var requestData,
					requestFailed = function(jqXHR, textStatus, errorThrown) {
						var errorText = window.formatAjaxError(textStatus, errorThrown),
							reject = function() {
								if (!instance.ignoreErrors) {
									if (!(additionalData && (additionalData.disabled ||
										(additionalData.login_required && !instance.isLoginSupported)))) {

										$.toast.error(String.format("{0}: {1}", url, errorText));
									}
								}
								if (window.console && window.console.log) {
									window.console.log(errorText);
								}
								deferred.reject.apply(this, rejectArguments);
							},
							rejectArguments = arguments;

						if (textStatus === "parsererror" && instance.proxy) {
							$.toast.warning(errorText);
							instance.proxy.ajax({
								"data": requestData,
								"dataType": "json",
								"url": url
							}).then(deferred.resolve, function() {
								reject();
							});
						} else {
							reject();
						}
					};

				if (additionalData &&
					additionalData.login_required &&
					instance.isLoginSupported) {

					$.ajax({
						"data": data,
						"headers": _oauth.toHeader(_oauth.authorize({
							"data": data,
							"url": url,
							"method": "GET"
						}, {
							"key": TOKEN,
							"secret": TOKEN_SECRET,
						})),
						"url": url
					}).then(deferred.resolve, requestFailed);
				} else {
					$.ajax({
						"crossDomain": true,
						"data": requestData = $.extend({ }, data, {
							"api_key": API_KEY,
							"_": $.now()
						}),
						"dataType": "jsonp",
						"url": url
					}).then(deferred.resolve, requestFailed);
				}
			}).promise();
		}, fn = function() {
			return $.when(ajaxFn()).then(function(ajaxData) {
				r.resolve(ajaxData);
			}, function() {
				r.reject();
			});
		};

		if (DEBUG) {
			window.setTimeout(function() {
				fn();
			}, DEBUG_TIMEOUT);
		} else {
			fn();
		}
		return r.promise();
	};

	var _getPage = function(tumblrName, pageName, data, additionalData) {
		return _getAjaxPage(String.format(API_URL_FORMAT, tumblrName, pageName), data, additionalData);
	};

	var _sortImageSizes = function(image1, image2) {
		return -(image1.width - image2.width);
	};

	var instance = {
		"getBlog": function(blog) {
			var avatarURLs = { },
				blogObject,
				lastInfo,
				name;

			if (!$.isPlainObject(blog)) {
				blog = {
					"url": blog
				};
			}
			while (blog.url.length && blog.url[blog.url.length - 1] === "/") {
				blog.url = blog.url.substr(0, blog.url.length - 1);
			};
			blog.url += "/";
			name = blog.name || window.location.noProtocol(blog.url);
			while (name.length && name[name.length - 1] === "/") {
				name = name.substr(0, name.length - 1);
			};
			blog.name = name;
			for (var i = 0; i < tumblr.AVATAR_SIZES.length; i++) {
				avatarURLs[tumblr.AVATAR_SIZES[i]] = window.location.sameProtocol(String.format(API_URL_FORMAT,
					blog.name, "avatar/" + tumblr.AVATAR_SIZES[i]));
			};
			blogObject = $.extend({ }, blog);
			delete blogObject.url;
			return {
				"data": blog,
				"getFollowers": function() {
					return _getPage(blog.name, "followers", undefined, this.data);
				},
				"getInfo": function(forceUseLogin) {
					if (forceUseLogin && !this.data.login_required) {
						this.data.login_required = true;
					}
					var result = $.Deferred(),
						reject = function(dataLength) {
							result.resolve({
								"blogURL": blog.url,
								"dataLength": dataLength || 0,
								"name": blog.name,
								"url": blog.url
							});
						};

					$.when(_getPage(blog.name, "info", undefined, this.data)).then(function(data) {
						var dataLength = window.JSON.stringify(data).length;

						if (data.meta.status === 200) {
							result.resolve(lastInfo = $.extend({ }, data.response.blog, {
								"archiveURL": window.tumblr.getArchiveURL(blog.url),
								"avatarURLs": avatarURLs,
								"blogURL": blog.url,
								"dataLength": dataLength,
								"description": data.response.blog.description.purify(),
								"exists": true,
								"name": blog.name,
								"updated": new Date(data.response.blog.updated * 1000),
								"url": data.response.blog.url.match(/www\.tumblr\.com\/blog\/view\//gi) ?
									blog.url :
									data.response.blog.url
							}, blogObject, {
								"title": data.response.blog.title || blog.name
							}));
						} else {
							if (!instance.ignoreErrors) {
								$.toast.error(String.format("{0}: {1}", blog.url, data.meta.msg));
							}
							reject(dataLength);
						}
					}, function() {
						reject();
					});
					return result.promise();
				},
				"getLikes": function() {
					return _getPage(blog.name, "likes", undefined, this.data);
				},
				"getPosts": function(page, info, type, count, tag, rebloggedInfo, notesInfo) {
					var requestData = {
						"limit": count,
						"notes_info": !!notesInfo,
						"reblog_info": !!rebloggedInfo,
						"offset": ((page) ? (page * count) : 0)
					};

					if (tag && tag.length) {
						requestData.tag = tag;
						type = undefined;
					}
					return $.when(_getPage(blog.name, "posts" + ((type) ? "/" + type : ""),
						requestData, this.data)).then(function(data) {

						var posts,
							stickies = 0;

						if (info) {
							if (type) {
								info.posts_per_type = info.posts_per_type || { };
								info.posts_per_type[type] = data.response.total_posts;
							} else {
								info.posts = data.response.total_posts;
							}
							info.updated = new Date(data.response.blog.updated * 1000);
						}
						posts = $(data.response.posts).map(function(index) {
							var audioURL,
								fileName,
								sourceElement;

							index -= stickies;

							var post = $.extend({ }, this, {
								"blog": info || lastInfo,
								"fullIndex": requestData.offset + index,
								"index": index,
								"summary": (this.summary || String.empty).purify(),
								"timestamp": new Date(this.timestamp * 1000)
							});

							if (this.dismissal !== undefined) {
								delete post.dismissal;
								delete post.index;
								delete post.fullIndex;
								post.sticky = true;
								stickies++;
							}

							switch (this.type) {
								case "audio":
									if ((audioURL = post.audio_url) && audioURL.length) {
										fileName = window.location.noHash(audioURL.split("/").pop());

										if (fileName.indexOf(".") < 0) {
											audioURL = String.format(AUDIO_URL_FORMAT, fileName)
										}
										post.download_url = post.audio_url = window.location.sameProtocol(audioURL);
										if (post.album_art && post.album_art.length) {
											post.album_art = window.location.sameProtocol(post.album_art);
										}
									}
									break;
								case "photo":
									$(post.photos).each(function(i) {
										var photo = this;

										photo.index = i;
										if (!photo.original_size.url.match("_1280.")) {
											$(photo.alt_sizes).each(function(j) {
												if (this.url.match("_1280.")) {
													photo.original_size.url = this.url;
													photo.corrected = true;
													return false;
												}
											});
											if (!photo.corrected) {
												if (photo.original_size.url.match("_500.")) {
													$(photo.alt_sizes).each(function(j) {
														if (this.url.match("_500.") && j) {
															photo.original_size.url = photo.alt_sizes[0].url =
																this.url.replace("_500.", "_1280.");
															photo.corrected = true;
															return false;
														}
													});
												}
											}
										}
										photo.download_url = photo.original_size.url = window.location
											.sameProtocol(photo.original_size.url);
										photo.photoID = post.id.toString() + "_" + photo.index.toString();
										$(photo.alt_sizes).each(function(j) {
											this.url = window.location.sameProtocol(this.url);
										});
										if (photo.corrected) {
											post.corrected = true;
										}
									});
									post.original_photos = post.photos;
									post.getBestFitPhotoIndex = _getBestFitPhotoIndex;
									break;
								case "video":
								default:
									if (post.video_url && post.video_url.length) {
										post.video_url = window.location.sameProtocol(post.video_url);
									} else {
										if (this.player && this.player.length) {
											sourceElement = $(document.createElement("div"))
												.html(this.player[this.player.length - 1].embed_code)
												.find("video>source");
										} else {
											sourceElement = this.body;

											if (!(sourceElement && sourceElement.length)) {
												sourceElement = this.answer;
											}
											if (sourceElement && sourceElement.length) {
												sourceElement = $(document.createElement("div"))
													.html(sourceElement
														.replace(/ src="/gi, " data-src=\"")
														.replace(/ srcset="/gi, " data-srcset=\"")
														.replace(/ poster="/gi, " data-poster=\""));
												sourceElement = sourceElement
													.find("video>source")
													.add(sourceElement.find("video[data-src]"));
											}
										}
										if (sourceElement && sourceElement.length) {
											post.videoType = sourceElement.attr("type");
											post.video_url = window.location.sameProtocol(sourceElement.attr("src") ||
												sourceElement.data("src"));
										}
									}
									if (post.download_url = post.video_url) {
										post.actual_type = "video";
									}
									break;
							}

							post.photos = (post.photos || [ ])
								.concat(_findTumblrPhotos(this.body))
								.concat(_findTumblrPhotos(this.caption))
								.concat(_findTumblrPhotos(this.answer))
								.concat(_findTumblrPhotos(this.description));

							if (post.photos) {
								if (post.photos.length) {
									if (!post.getBestFitPhotoIndex) {
										post.getBestFitPhotoIndex = _getBestFitPhotoIndex;
									}
								} else {
									delete post.photos;
								}
							}
							return post;
						}).get();
						posts.dataLength = window.JSON.stringify(data).length;
						return posts;
					});
				},
				"name": blog.name,
				"url": blog.url
			};
		},
		"ignoreErrors": false,
		"isLoginSupported": window.CryptoJS !== undefined &&
			SECRET && SECRET.length &&
			TOKEN && TOKEN.length &&
			TOKEN_SECRET && TOKEN_SECRET.length,
	};
	return instance;
};
window.tumblr.AVATAR_SIZES = [ 16, 24, 30, 40, 48, 64, 96, 128, 512 ];
window.tumblr.MAX_POSTS_PER_PAGE = 20;
window.tumblr.MEDIAURL1 = /\d{2}\.media\.tumblr\.com\/.*\/.*\/s(\d{1,4})x(\d{1,4})\//i;
window.tumblr.MEDIAURL2 = /\d{2}\.media\.tumblr\.com\//i;
window.tumblr.PHOTOURL = /\.tumblr\.com\/.*tumblr_.*_(\d{1,4})\./i;
window.tumblr.POST_TYPES = [
	  { "description": "All posts", "value": "" }
	, { "description": "Photos", "value": "photo" }
	, { "description": "Videos", "value": "video" }
	, { "description": "Texts", "value": "text" }
	, { "description": "Answers", "value": "answer" }
	, { "description": "Quotes", "value": "quote" }
	, { "description": "Links", "value": "link" }
	, { "description": "Chats", "value": "chat" }
	, { "description": "Audio", "value": "audio" }
];
window.tumblr.getArchiveURL = function(blogURL) {
	if (blogURL && blogURL.length) {
		while (blogURL.slice(-1) === "/") {
			blogURL = blogURL.substr(0, blogURL.length - 1);
		}
		return window.location.sameProtocol(blogURL + "/archive/");
	}
};
window.tumblr.isPhotoURL = function(url) {
	var matches = url.match(window.tumblr.PHOTOURL);

	if (matches) {
		if (arguments.length > 1) {
			arguments[1].isPhoto = true;
			arguments[1].matches = matches;
		}
		return true;
	}
	matches = url.match(window.tumblr.MEDIAURL1);
	if (matches) {
		if (arguments.length > 1) {
			matches.pop();
			arguments[1].matches = matches;
		}
		return true;
	}
	return !!url.match(window.tumblr.MEDIAURL2);
};
