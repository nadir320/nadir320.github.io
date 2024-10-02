/*
	- fix bug in autocorrect useless posts
	- try to detect post links and display the single post (navigate to it?)
	- try to detect /tagged links and change them accordingly

	- CHECK_ALL_BLOGS single-click button?
	- Search?
	- Change CSS filters to a plugin?
	- GIF player for a single image in full-screen mode?
	- Blog activity graph? (in another page, like the downloader?)
*/

"use strict";

var PARAMETERS = {
	  "blogs": "blogs"
	, "checkAllBlogs": "checkAllBlogs"
	, "cleanupDataStore": "cleanupDataStore"
	, "dataStoreCleanupInterval" : "dataStoreCleanupInterval"
	, "debugTimeout": "debugTimeout"
	, "favicon": "favicon"
	, "hideOffscreenAnimations": "hideOffscreenAnimations"
	, "indexedDB": "indexedDB"
	, "language": "language"
	, "noLocalProxyOnLocalhost": "noLocalProxyOnLocalhost"
	, "officeMode": "officeMode"
	, "optionsKey": "optionsKey"
	, "password": "password"
	, "peek": "peek"
	, "poolSize": "poolSize"
	, "postsPerPageStep": "postsPerPageStep"
	, "preloadTimeout": "preloadTimeout"
	, "storage": "storage"
	, "title": "title"
	, "username": "username"
};

var BLANK_PAGE = "about:blank",
	CHECK_ALL_BLOGS = !!window.location.get(PARAMETERS.checkAllBlogs),
	CLEANUP_DATASTORE = !!window.location.get(PARAMETERS.cleanupDataStore),
	DATASTORE_CLEANUP_INTERVAL = parseInt(window.location.get(PARAMETERS.dataStoreCleanupInterval)) || 0,
	DEBUG_TIMEOUT = parseInt(window.location.get(PARAMETERS.debugTimeout)) || 2000,
	DEFAULT_TIMEOUT = 150,
	DOWNLOAD_FILENAME_HTML = "{0}.html",
	DOWNLOAD_FILENAME_TEXT = "{0}.txt",
	DOWNLOAD_FILENAME_XML = "{0}.xml",
	DOWNLOAD_SERVERS = [ "va.media", "ve.media", "vt", "vt.media", "vtt" ],
	HIDE_OFFSCREEN_ANIMATIONS = !!window.location.get(PARAMETERS.hideOffscreenAnimations),
	IDB = !!window.location.get(PARAMETERS.indexedDB),
	IFRAME_ALLOWED_HOSTS = [ "youtube.com", "youtu.be", "youtube-nocookie.com", "spotify.com" ],
	NO_LOCAL_PROXY_ON_LOCALHOST = !!parseInt(window.location.get(PARAMETERS.noLocalProxyOnLocalhost)),
	OFFICE_MODE = window.parseInt(window.location.get(PARAMETERS.officeMode)) || 0,
	PEEK = !!window.location.get(PARAMETERS.peek),
	POOL_SIZE = parseInt(window.location.get(PARAMETERS.poolSize)) || 6,
	POSTS_PER_PAGE_STEP = parseInt(window.location.get(PARAMETERS.postsPerPageStep)) || 5,
	PRELOAD_TIMEOUT = parseInt(window.location.get(PARAMETERS.preloadTimeout)) || DEFAULT_TIMEOUT,
	PROXIES = {
		"local": "Local CORS Proxy",
		"remote": "allOrigins"
	},
	STORAGE_NAME = window.location.get(PARAMETERS.optionsKey) || "my_tumblr",
	TEMPORARY_STORAGE_TYPE = window.location.get(PARAMETERS.storage) || "session",
	THEME_ID = "pageTheme",
	THEMECOLOR_ID = "themeColor",
	VIBRATIONS = {
		DEFAULT: [ 100 ],
		NEW_BLOGS_FOUND: [ 100, 100, 100 ]
	},
	XMLHTTPDOWNLOAD = window.XMLHttpRequest &&
		"withCredentials" in new window.XMLHttpRequest() &&
		window.URL;

var DATASTORE3_API_KEY = "AIzaSyA4dckJaCSBB1R7gJVuWCeYXjr7P6Oi9DM",
	DATASTORE_ID = "glowing-fire-7537",
	FULLHD = {
		"height": 1080,
		"horizontalImage": "images/fullHD.png",
		"width": 1920,
		"verticalImage": "images/fullHDv.png"
	},
	HD = {
		"height": 720,
		"horizontalImage": "images/hd.png",
		"width": 1280,
		"verticalImage": "images/hdv.png"
	},
	IDLE_INTERVAL = 5 * 60 * 1000,						// 5 minutes
	MAXIMUM_DOWNLOAD_FILENAME = 160,
	OLD_BLOG_INTERVAL = 90 * 24 * 60 * 60 * 1000,		// 90 days
	STORAGE_NAME_READLATER = STORAGE_NAME + "_readLater",
	STORAGE_NAME_USELESS = STORAGE_NAME + "_useless",
	PASSWORD = window.location.get(PARAMETERS.password),
	TABLE_DATES = "dates",
	TABLE_DOWNLOADS = "downloads",
	TABLE_READLATER = "readLater",
	TABLE_USELESS = "useless",
	USERNAME = window.location.get(PARAMETERS.username),
	VALUE_DOWNLOADS_COUNT = "_count",
	VALUE_DOWNLOADS_DATE = "_date",
	VALUE_DOWNLOADS_SIZE = "_size";

var textTables = {
	"en": {
		  "activeDownloads": "Active downloads ({0})"
		, "add": "Add"
		, "addBlog": "Add to my blogs"
		, "addToReadLater": "Add to read later list"
		, "addUseless": "Add as globally useless entry"
		, "addUseless2": "Add as globally useless entry:"
		, "ago": "{0} ago"
		, "alreadyDownloadedFrom": "{0}\nDownloaded from {1}\non {2}"
		, "alreadyAutomaticallyDownloadedFrom": "{0}\nAutomatically downloaded from {1}\non {2}"
		, "archive": "Archive"
		, "ascending": "ascending"
		, "asked": "{0} asked:"
		, "audioTitle": "{0} - {1} (from {2})"
		, "autoUpdatedBlogs" : "Auto-corrected blogs: {0}"
		, "autoUpdatePostCountMismatches": "Auto-correct post count mismatches"
		, "autoUpdatingPostCountMismatches": "Auto-correcting post count of {0}"
		, "avatarSize": "Avatar size:"
		, "blogNotFound": "Cannot find blog '{0}'."
		, "blogRecovered": "Blog '{0}' is online again!"
		, "blogRedundant": "NSFW state for '{0}' is redundant."
		, "blogStatistics": "Statistics"
		, "blogTitle": "{0} ({1} posts)"
		, "cancel": "Cancel"
		, "change": "Change"
		, "changePassword": "Change password"
		, "checkUselessPosts": "Auto check for useless posts"
		, "confirmAddBlog": "Are you sure you want to add '{0}' to your blogs?"
		, "confirmAddToReadLater": "Are you sure you want to add '{0}' to your 'Read Later' blogs?"
		, "confirmClearReadLater": "Are you sure you want to remove all the 'Read Later' blogs?"
		, "confirmDisableBlog": "Are you sure you want to disable '{0}'?"
		, "confirmEnableBlog": "Are you sure you want to re-enable '{0}'?"
		, "confirmNewPassword": "Confirm password:"
		, "confirmRemoveFromGlobalUseless": "Are you sure you want to remove '{0}' from the global useless entries?"
		, "confirmRemoveFromReadLater": "Are you sure you want to remove '{0}' from the 'Read Later' blogs?"
		, "connect": "Connect"
		, "cssFilters": {
			  "blur": "Blur"
			, "brightness": "Brightness"
			, "contrast": "Contrast"
			, "dropShadow": "Drop shadow"
			, "grayScale": "Gray scale"
			, "hueRotation": "Hue"
			, "invert": "Invert colors"
			, "opacity": "Opacity"
			, "saturate": "Saturation"
			, "sepia": "Sepia effect"
		}
		, "customGifControls": "Use custom controls for GIF images"
		, "customVideoControls": "Use custom video controls"
		, "databaseError": "Cannot open database: {0}"
		, "dataStorageChangingPassword": "Changing password..."
		, "dataStorageConnected": "Connected"
		, "dataStorageConnecting": "Connecting..."
		, "dataStorageDownloaded": "Data downloaded ({0})"
		, "dataStorageDownloading": "Downloading latest data"
		, "dataStorageInvalidPassword": "The specified password is not correct."
		, "dataStorageInvalidUsername": "The specified e-mail address is not correct."
		, "dataStoragePasswordChanged": "Password for {0} changed successfully."
		, "dataStorageReset": "Data storage reset"
		, "dataStorageUpdated": "Data storage updated"
		, "dateIntervalOptions": {
			  "day": " day"
			, "days": " days"
			, "hour": " h"
			, "hours": " h"
			, "includeMilliseconds": false
			, "millisecond": undefined
			, "milliseconds": undefined
			, "minute": " m"
			, "minutes": " m"
			, "month": " month"
			, "months": " months"
			, "second": " s"
			, "seconds": " s"
			, "separator": ", "
			, "week": " week"
			, "weeks": " weeks"
			, "year": " year"
			, "years": " years"
		}
		, "deleteAll": "Delete all"
		, "descending": "descending"
		, "disableBlog": "Disable this blog"
		, "downloadAsHTML": "Download as HTML"
		, "downloadAsText": "Download as text"
		, "downloadAsXml": "Download as XML"
		, "downloadCompleted": "{0}: download completed ({1})."
		, "downloading": "Downloading '{0}'..."
		, "downloadingDownloads": "Updating downloads..."
		, "downloadProgress": "{2} ({0}) of {1} downloaded\ncurrent speed: {3}/s, average: {4}/s, maximum: {5}/s\nelapsed: {8}\nestimated total time: {9}, remaining: {10}"
		, "downloadProgressWithWait": "{2} ({0}) of {1} downloaded\ncurrent speed: {3}/s, average: {4}/s, maximum: {5}/s\nelapsed: {7}, waited: {6}, total: {8}\nestimated total time: {9}, remaining: {10}"
		, "downloads": "Downloads"
		, "downloadsInPage": "{1} downloads in page {0}"
		, "downloadsInProgress": "One or more download is still in progress."
		, "downloadsSynchronized": "Downloads synchronized ({0})."
		, "downloadsUpToDate": "Downloads list already up-to-date"
		, "downloadSynchronization": "Download synchronization:"
		, "downloadSynchronization_ask": "Ask"
		, "downloadSynchronization_skip": "Skip"
		, "downloadSynchronization_synchronize": "Synchronize"
		, "duration": "{0}:{1}"
		, "emailAddress": "E-mail address:"
		, "embeddedIFrameText": "Page is loading. If it does not appear after a while try to view it directly in your browser by clicking the link."
		, "embedLinks": "Embed links"
		, "embedVideos": "Embed videos"
		, "enableBlog": "Re-enable this blog"
		, "enableFullScreenViewer": "Enable full-page view"
		, "enableFullScreenViewerFullScreen": "Enable true full screen view"
		, "enableImageSearch": "Enable image search"
		, "expandTags": "Expand tags"
		, "findDownloads": "Search"
		, "firstPostOn": "First post on"
		, "followers": "Followers:"
		, "forceNSFW": "Force NSFW:"
		, "forceNSFW_NoForce": "Don't force"
		, "forceNSFW_NSFW": "Force NSFW"
		, "forceNSFW_SFW": "Force SFW"
		, "fromNow": "{0} from now"
		, "goTo": "Go to:"
		, "goToLastViewedPage": "Last viewed page"
		, "goToPage": "Go to page:"
		, "hideOldies": "Hide oldies"
		, "imageResolution": "Images' resolution:"
		, "imageSize": "Photo size:"
		, "imageSize_alwaysBest": "Always use highest resolution"
		, "imageSize_alwaysSmall": "Always use small resolution"
		, "imageSize_alwaysMicro": "Always use smallest resolution"
		, "imageSize_best": "Use highest resolution"
		, "imageSize_micro": "Use smallest resolution"
		, "imageSize_small": "Use small resolution"
		, "later": "Later"
		, "lastUpdatedOn": "Last updated on"
		, "lastViewed": "Last viewed: {0} ago"
		, "lastViewedOn": "Last viewed"
		, "lessThanZero": "{0}+"
		, "likes": "Likes:"
		, "link": "Link"
		, "loadingBlogs": "Loading {0} blogs..."
		, "loadingBlogsProgress": "Checking {0} / {1} blogs...\n{2} downloaded"
		, "loadingData": "Downloading latest data..."
		, "loadingPage": "Loading page {0}..."
		, "loginRequired": "Login required"
		, "more": "More..."
		, "more2": "{0} more"
		, "my": "My"
		, "nativeDownload": "Use native download"
		, "never": "Never"
		, "newBlogs": "Updated blogs: {0}\nNew posts: {1}"
		, "newBlogsStatus": "{0}: {1} (SFW: {2}, NSFW: {3})\nNew posts: {4} (SFW: {5}, NSFW: {6})\nLast updated: {7}\non {8}\n({9})\nLast viewed: {10}\non {11}\n({12})"
		, "newBlogsStatusTitle": "Updated blogs"
		, "newBlogsTitle": "Updated {0} / {1}:"
		, "newPassword": "New password:"
		, "newPasswordMismatch": "Please correctly confirm the new password."
		, "newPasswordRequired": "Please specify the new password."
		, "newPosts": "New posts: "
		, "newPostsSuffix": "{0} new"
		, "newPostsTitle": "({0} / {1})"
		, "no": "No"
		, "noActiveDownload": "No active download"
		, "noBlog": "No blog for the current user"
		, "noDownloadsInPage": "No downloads in page {0}"
		, "noNewPost": "No new post"
		, "nonNewBlogsStatus": "{0}: {1} (SFW: {2}, NSFW: {3})\nTotal posts: {4} (SFW: {5}, NSFW: {6})\nLast updated: {7}\non {8}\n({9})\nLast viewed: {10}\non {11}\n({12})\nChanged: {13}"
		, "notAvailable": "N/A"
		, "notes": "({0} notes)"
		, "notFoundBlogs": "Not found ({0}):"
		, "now": "Now"
		, "nsfw": "NSFW:"
		, "nsfwOnly": "NSFW blogs only"
		, "ok": "OK"
		, "oldBlogs": "Oldies ({0}):"
		, "oldBlogsStatusTitle": "Oldies"
		, "oldPassword": "Current password:"
		, "oldPasswordRequired": "Please specify the current password."
		, "options": "Options"
		, "pageNumber": "Page {0} / {1}"
		, "pageNumber2": "Page {0} / {1} / {2}"
		, "pageTitle": "My tumblr."
		, "password": "Password:"
		, "passwordRequired": "Please provide a password."
		, "peekMode": "Peek mode"
		, "percent": "{0}%"
		, "photoIndex": "Photo #{0}"
		, "posts": "Posts: "
		, "postsPerDay": "Average posts per day"
		, "postsPerPage": "Posts per page:"
		, "postTypes": {
			  "": "All posts"
			, "answer": "Answers"
			, "audio": "Audio"
			, "chat": "Chats"
			, "link": "Links"
			, "photo": "Photos"
			, "quote": "Quotes"
			, "text": "Texts"
			, "video": "Videos"
		}
		, "preloadImages": "Preload images"
		, "preloadImages2": "Preload images:"
		, "preloadImages_DontPreload": "Never preload"
		, "preloadImages_Preload": "Always preload"
		, "readBlogs": "Read ({0}):"
		, "readBlogsStatusTitle": "Read blogs"
		, "readLater": "Read later ({0})"
		, "readLaterTitle": "To read"
		, "refreshCurrentPage": "Refresh current page"
		, "rememberMe": "Save access"
		, "removeUseless": "Remove from global useless entries"
		, "requireDownloadsSynchronization": "Synchronize downloads list?"
		, "reset": "Reset"
		, "resetPostType": "Show all posts"
		, "searching": "Searching..."
		, "searchingInPage": "Searching in page {0}..."
		, "searchingInPage2": "Searching in page {0}/{1}..."
		, "searchingInPage3": "{0} ({1}/{2})\nPage {3}/{4}..."
		, "searchTag": "Search tag:"
		, "seen": "Seen: {0}"
		, "seenPosts": "Posts when seen: {0}"
		, "showAllImageSizes": "Show all image sizes"
		, "showMissingDownloads": "Show missing downloads count\ninstead of already downloaded count"
		, "showNotes": "Show notes"
		, "showNSFWBlogs": "Show NSFW blogs"
		, "showPosts": "Show posts:"
		, "showTags": "Show tags"
		, "size": "{0} x {1}"
		, "sort": {
			  "name": "Name"
			, "posts": "Posts"
			, "updated": "Last update"
			, "viewed": "Last viewed"
		}
		, "sortBy": "Sort by:"
		, "sortByPosts": "Sort by number of new posts"
		, "synchronizingDownloads": "Synchronizing downloads..."
		, "taggedPosts": "{0}\nPosts tagged '{1}'"
		, "theme": "Theme:"
		, "three": "{0} / {1} / {2}"
		, "threeFrom": "{0} ({1}, from {2})"
		, "totalPosts": "Total posts"
		, "two": "{0} / {1}"
		, "two2": "{0} - {1}"
		, "two3": "{0} ({1})"
		, "two4": "{0}\n{1}"
		, "two5": "{0}, {1}"
		, "twoFrom": "{0} (from {1})"
		, "typedPosts": "{0} ({1} {2} posts)"
		, "unknown": "???"
		, "unknownAlbum": "Unknown album"
		, "unknownArtist": "Unknown artist"
		, "unknownDownloadProgress": "{0} downloaded\ncurrent speed: {3}/s, average: {4}/s, maximum: {5}/s\nelapsed: {8}"
		, "unknownDownloadProgressWithWait": "{0} downloaded\ncurrent speed: {3}/s, average: {4}/s, maximum: {5}/s\nelapsed: {7}, waited: {6}, total: {8}"
		, "unknownTrackName": "Unknown track name"
		, "updated": "Updated: {0}"
		, "upgradingDatabase": "Upgrading database..."
		, "usageMode": "Usage mode"
		, "usageModes": {
			  "car_daily": "Car (day)"
			, "car_nightly": "Car (night)"
			, "home_daily": "Home (day)"
			, "home_nightly": "Home (night)"
			, "office": "Office"
			, "outside_daily": "Outside (day)"
			, "outside_nightly": "Outside (night)"
		}
		, "useDefault": "Use default setting"
		, "usernameRequired": "Please specify a valid e-mail address."
		, "version": "Version: {0}"
		, "vibrateOnCheckCompletion": "Vibrate on loading completion"
		, "view": "View"
		, "viewDownloads": "Downloads in page ({0}/{1})"
		, "viewed": "Viewed: {0}"
		, "waitingForDownloads": "Waiting for downloads..."
		, "yes": "Yes"
	},
	"it": {
		  "activeDownloads": "Download in corso ({0})"
		, "add": "Aggiungi"
		, "addBlog": "Aggiungi ai miei blog"
		, "addToReadLater": "Aggiungi ai blog da leggere più tardi"
		, "addUseless": "Aggiungi come filtro globale"
		, "addUseless2": "Aggiungi come filtro globale:"
		, "ago": "{0} fa"
		, "alreadyDownloadedFrom": "{0}\nScaricato da {1}\nil {2}"
		, "alreadyAutomaticallyDownloadedFrom": "{0}\nScaricato automaticamente da {1}\nil {2}"
		, "archive": "Archivio"
		, "ascending": "ascendente"
		, "asked": "{0} ha chiesto:"
		, "audioTitle": "{0} - {1} (da {2})"
		, "autoUpdatedBlogs" : "Blog corretti automaticamente: {0}"
		, "autoUpdatePostCountMismatches": "Correggi automaticamente\ngli errori sul numero di post"
		, "autoUpdatingPostCountMismatches": "Correzione automatica del numero di post di {0}"
		, "avatarSize": "Dimensione avatar:"
		, "blogNotFound": "Blog '{0}' non trovato."
		, "blogRecovered": "'{0}' è di nuovo disponibile!"
		, "blogRedundant": "Lo stato NSFW per '{0}' è ridondante."
		, "blogStatistics": "Statistiche"
		, "blogTitle": "{0} ({1} post)"
		, "cancel": "Annulla"
		, "change": "Cambia"
		, "changePassword": "Cambio password"
		, "checkUselessPosts": "Controlla automaticamente post filtrati"
		, "confirmAddBlog": "Aggiungere '{0}' ai blog?"
		, "confirmAddToReadLater": "Aggiungere '{0}' ai blog da leggere più tardi?"
		, "confirmClearReadLater": "Cancellare tutti i blog da leggere più tardi?"
		, "confirmDisableBlog": "Disabilitare '{0}'?"
		, "confirmEnableBlog": "Ri-abilitare '{0}'?"
		, "confirmNewPassword": "Conferma password:"
		, "confirmRemoveFromGlobalUseless": "Rimuovere '{0}' dai filtri globali?"
		, "confirmRemoveFromReadLater": "Rimuovere '{0}' dai blog da leggere più tardi?"
		, "connect": "Entra"
		, "cssFilters": {
			  "blur": "Sfocatura"
			, "brightness": "Luminosità"
			, "contrast": "Contrasto"
			, "dropShadow": "Ombreggiatura"
			, "grayScale": "Scala di grigi"
			, "hueRotation": "Tonalità"
			, "invert": "Inversione colori"
			, "opacity": "Opacità"
			, "saturate": "Saturazione"
			, "sepia": "Effetto seppia"
		}
		, "customGifControls": "Usa controlli personalizzati per le immagini GIF"
		, "customVideoControls": "Usa controlli video personalizzati"
		, "databaseError": "Impossibile aprire il database: {0}"
		, "dataStorageChangingPassword": "Cambio password in corso..."
		, "dataStorageConnected": "Connesso"
		, "dataStorageConnecting": "Connessione in corso..."
		, "dataStorageDownloaded": "Dati scaricati ({0})"
		, "dataStorageDownloading": "Aggiornamento dei dati..."
		, "dataStorageInvalidPassword": "La password specificata non è corretta."
		, "dataStorageInvalidUsername": "L'indirizzo e-mail specificato non è corretto."
		, "dataStoragePasswordChanged": "Password per {0} cambiata."
		, "dataStorageReset": "Dati reimpostati"
		, "dataStorageUpdated": "Dati aggiornati"
		, "dateIntervalOptions": {
			  "day": " giorno"
			, "days": " giorni"
			, "hour": " h"
			, "hours": " h"
			, "includeMilliseconds": false
			, "millisecond": undefined
			, "milliseconds": undefined
			, "minute": " m"
			, "minutes": " m"
			, "month": " mese"
			, "months": " mesi"
			, "second": " s"
			, "seconds": " s"
			, "separator": ", "
			, "week": " settimana"
			, "weeks": " settimane"
			, "year": " anno"
			, "years": " anni"
		}
		, "deleteAll": "Cancella tutti"
		, "descending": "discendente"
		, "disableBlog": "Disabilita questo blog"
		, "downloadAsHTML": "Scarica come HTML"
		, "downloadAsText": "Scarica come testo"
		, "downloadAsXml": "Scarica come XML"
		, "downloadCompleted": "{0}: download completato ({1})."
		, "downloading": "Download di '{0}' in corso..."
		, "downloadingDownloads": "Aggiornamento lista dei download..."
		, "downloadProgress": "{2} ({0}) di {1} scaricati\nvelocità: {3}/s, media: {4}/s, massima: {5}/s\ntrascorso: {8}\ntempo totale stimato: {9}, rimanente: {10}"
		, "downloadProgressWithWait": "{2} ({0}) di {1} scaricati\nvelocità: {3}/s, media: {4}/s, massima: {5}/s\ntrascorso: {7}, in attesa: {6}, totale: {8}\ntempo totale stimato: {9}, rimanente: {10}"
		, "downloads": "Download"
		, "downloadsInPage": "{1} download in pagina {0}"
		, "downloadsInProgress": "Ci sono ancora dei download attivi."
		, "downloadsSynchronized": "Download aggiornati ({0})."
		, "downloadsUpToDate": "Lista dei download già aggiornata"
		, "downloadSynchronization": "Sincronizzazione download:"
		, "downloadSynchronization_ask": "Chiedi"
		, "downloadSynchronization_skip": "Salta"
		, "downloadSynchronization_synchronize": "Sincronizza"
		, "duration": "{0}:{1}"
		, "emailAddress": "Indirizzo e-mail:"
		, "embeddedIFrameText": "La pagina è in caricamento. Se non viene correttamente visualizzata provare a visualizzarla direttamente nel browser cliccando sul collegamento."
		, "embedLinks": "Incorpora i collegamenti"
		, "embedVideos": "Incorpora i video"
		, "enableBlog": "Ri-abilita questo blog"
		, "enableFullScreenViewer": "Abilita vista a tutta pagina"
		, "enableFullScreenViewerFullScreen": "Abilita vista a schermo intero"
		, "enableImageSearch": "Abilita ricerca per immagine"
		, "expandTags": "Espandi i tag"
		, "findDownloads": "Cerca"
		, "firstPostOn": "Iniziato"
		, "followers": "Seguito da:"
		, "forceNSFW": "Forza stato NSFW:"
		, "forceNSFW_NoForce": "Non forzare"
		, "forceNSFW_NSFW": "Forza NSFW"
		, "forceNSFW_SFW": "Forza SFW"
		, "fromNow": "Fra {0}"
		, "goTo": "Vai a:"
		, "goToLastViewedPage": "Ultima pagina vista"
		, "goToPage": "Vai alla pagina:"
		, "hideOldies": "Nascondi i blog vecchi"
		, "imageResolution": "Qualità delle immagini:"
		, "imageSize": "Dimensioni foto:"
		, "imageSize_alwaysBest": "Usa sempre risoluzione più alta"
		, "imageSize_alwaysMicro": "Usa sempre risoluzione più bassa"
		, "imageSize_alwaysSmall": "Usa sempre risoluzione ridotta"
		, "imageSize_best": "Usa risoluzione più alta"
		, "imageSize_micro": "Usa risoluzione più bassa"
		, "imageSize_small": "Usa risoluzione ridotta"
		, "later": "Più tardi"
		, "lastUpdatedOn": "Ultimo aggiornamento"
		, "lastViewed": "Visto: {0} fa"
		, "lastViewedOn": "Visto"
		, "lessThanZero": "{0}+"
		, "likes": "Piace:"
		, "link": "Link"
		, "loadingBlogs": "Caricamento di {0} blog..."
		, "loadingBlogsProgress": "Aggiornamento blog {0} / {1}...\n{2} scaricati"
		, "loadingData": "Aggiornamento dei dati..."
		, "loadingPage": "Caricamento pagina {0}..."
		, "loginRequired": "Login necessario"
		, "more": "Altri..."
		, "more2": "Altri {0}"
		, "my": "Il mio"
		, "nativeDownload": "Usa download nativo"
		, "never": "Mai"
		, "newBlogs": "Blog aggiornati: {0}\nNuovi post: {1}"
		, "newBlogsStatus": "{0}: {1} (SFW: {2}, NSFW: {3})\nNuovi post: {4} (SFW: {5}, NSFW: {6})\nUltimo aggiornamento: {7}\nil {8}\n({9})\nUltima visita: {10}\nil {11}\n({12})"
		, "newBlogsStatusTitle": "Blog aggiornati"
		, "newBlogsTitle": "Aggiornati {0} / {1}:"
		, "newPassword": "Nuova password:"
		, "newPasswordMismatch": "Confermare correttamente la nuova password."
		, "newPasswordRequired": "Inserire la nuova password."
		, "newPosts": "Nuovi post: "
		, "newPostsSuffix": "{0} nuovi"
		, "newPostsTitle": "({0} / {1})"
		, "no": "No"
		, "noActiveDownload": "Nessun download"
		, "noBlog": "Nessun blog per l'utente corrente"
		, "noDownloadsInPage": "Nessun download in pagina {0}"
		, "noNewPost": "Nessun nuovo post"
		, "nonNewBlogsStatus": "{0}: {1} (SFW: {2}, NSFW: {3})\nPost totali: {4} (SFW: {5}, NSFW: {6})\nUltimo aggiornamento: {7}\nil {8}\n({9})\nUltima visita: {10}\nil {11}\n({12})\nCambiati: {13}"
		, "notAvailable": "N/D"
		, "notes": "({0} note)"
		, "notFoundBlogs": "Non trovati ({0}):"
		, "now": "Adesso"
		, "nsfw": "NSFW:"
		, "nsfwOnly": "Solo blog NSFW"
		, "ok": "OK"
		, "oldBlogs": "Vecchi ({0}):"
		, "oldBlogsStatusTitle": "Blog vecchi"
		, "oldPassword": "Password corrente:"
		, "oldPasswordRequired": "Inserire la password corrente."
		, "options": "Opzioni"
		, "pageNumber": "Pagina {0} / {1}"
		, "pageNumber2": "Pagina {0} / {1} / {2}"
		, "pageTitle": "Il mio tumblr."
		, "password": "Password:"
		, "passwordRequired": "Inserire la password."
		, "peekMode": "Visualizza soltanto"
		, "percent": "{0}%"
		, "photoIndex": "Foto #{0}"
		, "posts": "Post: "
		, "postsPerDay": "Post al giorno"
		, "postsPerPage": "Post per pagina:"
		, "postTypes": {
			  "": "Tutti i post"
			, "answer": "Domande"
			, "audio": "Audio"
			, "chat": "Chat"
			, "photo": "Foto"
			, "link": "Collegamenti"
			, "quote": "Citazioni"
			, "text": "Testi"
			, "video": "Video"
		}
		, "preloadImages": "Precarica le immagini"
		, "preloadImages2": "Precarica le immagini:"
		, "preloadImages_DontPreload": "Non precaricare mai"
		, "preloadImages_Preload": "Precarica sempre"
		, "readBlogs": "Letti ({0}):"
		, "readBlogsStatusTitle": "Blog letti"
		, "readLater": "Leggi più tardi ({0})"
		, "readLaterTitle": "Da leggere"
		, "refreshCurrentPage": "Aggiorna pagina corrente"
		, "rememberMe": "Ricorda accesso"
		, "removeUseless": "Rimuovi dai filtri globali"
		, "requireDownloadsSynchronization": "Aggiornare la lista dei download?"
		, "reset": "Reimposta"
		, "resetPostType": "Visualizza tutti i post"
		, "searching": "Ricerca in corso..."
		, "searchingInPage": "Ricerca in corso in pagina {0}..."
		, "searchingInPage2": "Ricerca in corso in pagina {0}/{1}..."
		, "searchingInPage3": "{0} ({1}/{2})\nPagina {3}/{4}..."
		, "searchTag": "Cerca tag:"
		, "seen": "Visitato: {0}"
		, "seenPosts": "Post quando visitato: {0}"
		, "showAllImageSizes": "Mostra dimensioni delle foto"
		, "showMissingDownloads": "Mostra il numero di donwload mancanti\ninvece che di quelli già scaricati"
		, "showNotes": "Mostra note"
		, "showNSFWBlogs": "Mostra blog NSFW"
		, "showPosts": "Tipo di post:"
		, "showTags": "Mostra tag"
		, "size": "{0} x {1}"
		, "sort": {
			  "name": "Nome"
			, "posts": "Numero di post"
			, "updated": "Ultimo aggiornamento"
			, "viewed": "Ultima visualizzazione"
		}
		, "sortBy": "Ordina per:"
		, "sortByPosts": "Ordina per numero di nuovi post"
		, "synchronizingDownloads": "Sincronizzazione download..."
		, "taggedPosts": "{0}\nPost taggati '{1}'"
		, "theme": "Tema:"
		, "three": "{0} / {1} / {2}"
		, "threeFrom": "{0} ({1}, da {2})"
		, "totalPosts": "Post totali"
		, "two": "{0} / {1}"
		, "two2": "{0} - {1}"
		, "two3": "{0} ({1})"
		, "two4": "{0}\n{1}"
		, "two5": "{0}, {1}"
		, "twoFrom": "{0} (da {1})"
		, "typedPosts": "{0} ({1} {2} post)"
		, "unknown": "???"
		, "unknownAlbum": "Album sconosciuto"
		, "unknownArtist": "Artista sconosciuto"
		, "unknownDownloadProgress": "{0} scaricati\nvelocità: {3}/s, media: {4}/s, massima: {5}/s\ntrascorso: {8}"
		, "unknownDownloadProgressWithWait": "{0} scaricati\nvelocità: {3}/s, media: {4}/s, massima: {5}/s\ntrascorso: {7}, in attesa: {6}, totale: {8}"
		, "unknownTrackName": "Brano sconosciuto"
		, "updated": "Aggiornato: {0}"
		, "upgradingDatabase": "Aggiornamento database..."
		, "usageMode": "Modo d'uso"
		, "usageModes": {
			  "car_daily": "Auto (giorno)"
			, "car_nightly": "Auto (notte)"
			, "home_daily": "Casa (giorno)"
			, "home_nightly": "Casa (notte)"
			, "office": "Ufficio"
			, "outside_daily": "Fuori (giorno)"
			, "outside_nightly": "Fuori (notte)"
		}
		, "useDefault": "Usa impostazione predefinita"
		, "usernameRequired": "Inserire un indirizzo e-mail."
		, "version": "Versione: {0}"
		, "vibrateOnCheckCompletion": "Vibra a caricamento completato"
		, "view": "Vedi"
		, "viewDownloads": "Download nella pagina ({0}/{1})"
		, "viewed": "Visto: {0}"
		, "waitingForDownloads": "In attesa dei download..."
		, "yes": "Sì"
	}
};

$().ready(function() {
	var _dates,
		_defaults = {
			  "autoUpdatePostCountMismatches": true
			, "avatarSize": 5	/* 64 */
			, "downloadSynchronization": "ask"
			, "customGifControls": false
			, "customVideoControls": true
			, "embedLinks": true
			, "embedVideos": false
			, "enableFullScreenViewer": true
			, "enableFullScreenViewerFullScreen": false
			, "enableImageSearch": true
			, "hideOldies": true
			, "imageSize": "small"
			, "lastPassword": String.empty
			, "lastUsername": String.empty
			, "nativeDownload": true
			, "nsfw": true
			, "peekMode": false
			, "postsPerPage": tumblr.MAX_POSTS_PER_PAGE / 2
			, "postType": String.empty
			, "preloadImages": false
			, "rememberMe": false
			, "searchNSFWOnly": false
			, "showAllImageSizes": false
			, "showMissingDownloads": false
			, "showNotes": false
			, "showTags": true
			, "sortByPosts": true
			, "theme": 15		/* Smoothness */
			, "vibrateOnCheckCompletion": false
		},
		_downloadManager = (function() {
			var dialogElement = $(".downloadsProgressDialog"),
				formatOptions = {
					"maximumFractionDigits": 1,
					"minimumFractionDigits": 1
				},
				listElement = dialogElement.find(".downloadList"),
				refreshButton = function() {
					var count = listElement.children().length;

					dialogElement.find(".noActiveDownload")[(!count) ?
						"fadeIn" :
						"fadeOut"]();
					dialogElement.dialog("option", "title", localizedFormat("activeDownloads", count));
					refreshDownloadsButtons(count);
				},
				removeRequest = function(request) {
					window.clearInterval(request.updateProgressInterval);
					if (request.response) {
						request.updateProgress({
							"lengthComputable": true,
							"loaded": request.response.size,
							"total": request.response.size
						});
					}
					request.progressElement.fadeOut("slow", function() {
						request.progressElement.remove();
						refreshButton();
					});
				};

			$(window).on({
				"beforeunload": function() {
					if (listElement.children().length) {
						return getLocalizedText("downloadsInProgress");
					}
				}
			});
			return {
				"count": function() {
					return listElement.children().length;
				},
				"downloadPost": function(post, url) {
					var downloadFileName,
						request,
						url;

					if (XMLHTTPDOWNLOAD) {
						if (!(url && url.length)) {
							url = post.download_url;
						}
						if (url && url.length) {
							request = new window.XMLHttpRequest();
							request.addEventListener("abort", function(e) {
								removeRequest(this);
							});
							request.addEventListener("load", function(e) {
								var fileSize,
									link,
									reader;

								if (this.status === 200) {
									fileSize = formatFileSize(this.response.size);

									link = $(document.createElement("a"))
										.attr({
											"download": this.downloadFileName,
											"href": window.URL.createObjectURL(this.response)
										})
										.hide()
										.appendTo(dialogElement);
									link.get(0).click();
									link.remove();
									$.toast.message(localizedFormat("downloadCompleted",
										this.downloadText, fileSize));
									removeRequest(this);
								} else {
									reader = new FileReader();

									reader.addEventListener("load", function(e) {
										$.toast.error($(this.result).text());
										removeRequest(request);
									});
									reader.readAsText(this.response);
								}
								keepAlive(false);
							});
							request.addEventListener("progress", request.updateProgress = function(e) {
								var eta,
									globalRate,
									maximumRate,
									now = $.now(),
									rate,
									totalTime,
									waited;

								if (!this.started) {
									this.started = now;
								}
								if (e) {
									if (e.loaded && !this.actuallyStarted) {
										this.actuallyStarted = now;
									}
									this.lastEvent = e;
								} else {
									e = this.lastEvent;
								}
								if (this.lastRate === undefined ||
									(now - this.lastDate >= 1e3)) {

									rate = (e.loaded - this.lastSize || e.loaded) / ((now - this.lastDate || now) / 1e3);
									globalRate = e.loaded / ((now - this.actuallyStarted) / 1e3);
									maximumRate = Math.max(makeFiniteNumber(this.lastMaximumRate), rate);

									this.lastRate = rate = makeFiniteNumber(rate);
									this.lastGlobalRate = globalRate = makeFiniteNumber(globalRate);
									this.lastMaximumRate = maximumRate = makeFiniteNumber(maximumRate);
									this.lastDate = now;
									this.lastSize = e.loaded;
								} else {
									rate = this.lastRate;
									globalRate = this.lastGlobalRate;
									maximumRate = this.lastMaximumRate;
								}

								var data = [
								/*  0 */	  formatFileSize(e.loaded, formatOptions)
								/*  1 */	, undefined
								/*  2 */	, undefined
								/*  3 */	, formatFileSize(rate || 0, formatOptions)
								/*  4 */	, formatFileSize(globalRate || 0, formatOptions)
								/*  5 */	, formatFileSize(maximumRate || 0, formatOptions)
								/*  6 */	, getDateInterval(waited = ((this.actuallyStarted || this.started) - this.started), true)
								/*  7 */	, getDateInterval(now - (this.actuallyStarted || this.started), true)
								/*  8 */	, getDateInterval(now - this.started, true)
								/*  9 */	, undefined
								/* 10 */	, undefined
								];

								if (e.lengthComputable) {
									this.progressBar.progressbar("option", "max", e.total);
									this.progressBar.progressbar("option", "value", e.loaded);
									eta = makeFiniteNumber((e.total - e.loaded) / globalRate) * 1e3;
									data[1] = formatFileSize(e.total, formatOptions);
									data[2] = localizedFormat("percent", (Math.roundTo(e.loaded / e.total * 100, 2) || 0)
										.toLocaleString(undefined, formatOptions));
									data[9] = getDateInterval(((this.actuallyStarted) ?
										(now - this.actuallyStarted) :
										0) + eta, true);
									data[10] = getDateInterval(eta, true);
								}
								data.splice(0, 0, ((e.lengthComputable) ?
									"downloadProgress" :
									"unknownDownloadProgress") + ((waited > 2e3) ?
										"WithWait" :
										String.empty));
								this.progressLabel
									.html(replaceHTMLNewLines(localizedFormat.apply(this, data)));
							});
							request.open("GET", getProxiedURL(url));
							request.responseType = "blob";
							request.progressElement = $(document.createElement("li"))
								.append(request.linkElement = $(document.createElement("a"))
									.addClass("downloadProgress")
									.attr({
										"download": downloadFileName = getDownloadFileName(post, url),
										"href": url,
										"target": "_blank",
										"title": getDownloadTitle(post, url)
									})
									.on({
										"click": function(e) {
											e.preventDefault();
										}
									})
									.text(getDownloadText(post, url)))
								.append(request.progressLabel = $(document.createElement("div"))
									.addClass("downloadProgressLabel"))
								.append(request.progressBar = $(document.createElement("div"))
									.addClass("downloadProgressBar")
									.progressbar({
										"value": false
									}))
								.append($(document.createElement("button"))
									.addClass("cancelDownload")
									.attr({
										"type": "button"
									})
									.on({
										"click": function(e) {
											request.abort();
											removeRequest(request);
										}
									})
									.button({
										"label": getLocalizedText("cancel")
									}))
								.appendTo(listElement);
							refreshButton();
							$($.toast.message(localizedFormat("downloading",
								request.downloadText = getDownloadText(post, url)))).on({
									"click": function(e) {
										/* showDownloads(); */
									}
								});
							keepAlive(true);
							setFileDownloaded(url, post);
							/* showDownloads(); */
							request.downloadFileName = downloadFileName;
							request.updateProgress({
								"lengthComputable": true,
								"loaded": 0,
								"total": 0
							});
							request.updateProgressInterval = window.setInterval($
								.proxy(request.updateProgress, request), 3 * DEFAULT_TIMEOUT);
							request.send();
						}
					}
				}
			};
		})(),
		_downloads = (function() {
			var KEY_PROPERTY = "key",
				STORAGE_NAME_ALLDOWNLOADS = "my_tumblr_alldownloads",
				STORAGE_NAME_DOWNLOADS = "my_tumblr_downloads";

			var db, downloads, open = $.Deferred();

			(function() {
				if (!window.indexedDB) {
					window.indexedDB = window.indexedDB ||
						window.mozIndexedDB ||
						window.webkitIndexedDB ||
						window.msIndexedDB;
				}
				if (!window.IDBTransaction) {
					window.IDBTransaction = window.IDBTransaction ||
						window.webkitIDBTransaction ||
						window.msIDBTransaction;
				}
				if (!window.IDBKeyRange) {
					window.IDBKeyRange = window.IDBKeyRange ||
						window.webkitIDBKeyRange ||
						window.msIDBKeyRange;
				}
				if (/*IDB && */window.indexedDB) {
					try {
						var request = window.indexedDB.open(STORAGE_NAME_DOWNLOADS, 3);

						request.onerror = function(e) {
							$.toast.error(localizedFormat("databaseError", e));
							open.reject(e);
						};
						request.onsuccess = function(e) {
							db = e.target.result;
							open.resolve(db);
						};
						request.onupgradeneeded = function(e) {
							$.toast.message(getLocalizedText("upgradingDatabase"));
							try {
								var db = event.target.result;

								try { db.deleteObjectStore(STORAGE_NAME_DOWNLOADS); } catch (ex) { }
								try { db.deleteObjectStore(STORAGE_NAME_ALLDOWNLOADS); } catch (ex) { }

								db.createObjectStore(STORAGE_NAME_DOWNLOADS, {
									keyPath: KEY_PROPERTY
								});
								db.createObjectStore(STORAGE_NAME_ALLDOWNLOADS, {
									keyPath: KEY_PROPERTY
								});
							} catch (ex) {
								$.toast.error(ex.message);
								open.reject(ex);
								throw ex;
							}
						};
					} catch (e) {
						$.toast.error(e.message);
						open.reject(e);
					}
				} else {
					open.reject();
				}
			})();

			var getFromDB = function(key, table) {
				return $.Deferred(function(deferred) {
					try {
						table = table || STORAGE_NAME_DOWNLOADS;

						var transaction = db.transaction([table]);

						var objectStore = transaction.objectStore(table);

						var request = objectStore.get(key);

						request.onerror = function(e) {
							$.toast.error(e);
							deferred.reject(e);
						};
						request.onsuccess = function(e) {
							deferred.resolve((request.result) ? request.result.value : undefined);
						};
					} catch (e) {
						$.toast.error(e.message);
					}
				});
			};

			var hasDB = function() {
				return open.promise();
			};

			var setInDB = function(key, value, table) {
				return $.Deferred(function(deferred) {
					try {
						table = table || STORAGE_NAME_DOWNLOADS;

						var transaction = db.transaction([table], "readwrite");

						var objectStore = transaction.objectStore(table);

						var data = {
							"value": value
						};

						data[KEY_PROPERTY] = key;

						var request = objectStore.put(data);

						request.onerror = function(e) {
							$.toast.error(e);
							deferred.reject(e);
						};
						request.onsuccess = function(e) {
							deferred.resolve(request.result);
						};
					} catch (e) {
						$.toast.error(e.message);
						deferred.reject(e);
					}
				});
			};

			return {
				"add": function(key, value) {
					if (IDB) {
						return $.when(hasDB()).then(function() {
							// add the object
						});
					}
					downloads[key] = value;
				},
				"contains": function(key) {
					if (IDB) {
						return $.when(hasDB()).then(function() {
							// get whether the key exists
						});
					}
					return !!downloads[key];
				},
				"delete": function(key) {
					if (IDB) {
						return $.when(hasDB()).then(function() {
							// remove the object
						});
					}
					delete downloads[key];
				},
				"get": function(key) {
					if (IDB) {
						return $.when(hasDB()).then(function() {
							// get the object
						});
					}
					return downloads[key];
				},
				"getCount": function() {
					if (IDB) {
						return $.when(hasDB()).then(function() {
							// get the count
						});
					}
					return downloads[VALUE_DOWNLOADS_COUNT];
				},
				"getDate": function() {
					var downloadsDate;

					if (IDB) {
						return $.when(hasDB()).then(function() {
							// get the date
						});
					}
					if ((downloadsDate = downloads[VALUE_DOWNLOADS_DATE]) &&
						downloadsDate.length &&
						!isNaN(parseInt(downloads[VALUE_DOWNLOADS_COUNT]))) {

						downloadsDate = new Date(downloadsDate);
					}
					if (downloadsDate && !downloadsDate.getTime) {
						downloadsDate = new Date(downloadsDate);
					}
					return downloadsDate;
				},
				"getSize": function() {
					if (IDB) {
						return $.when(hasDB()).then(function() {
							// get the size
						});
					}
					return downloads[VALUE_DOWNLOADS_SIZE];
				},
				"load": function() {
					if (!IDB) {
						var value = window.localStorage.getItem(STORAGE_NAME_DOWNLOADS);

						if (value && value.length) {
							downloads = window.JSON.parse(value);
						} else {
							return $.Deferred(function(deferred) {
								$.when(hasDB()).then(function() {
									$.when(getFromDB(STORAGE_NAME_DOWNLOADS, STORAGE_NAME_ALLDOWNLOADS)).then(function(dbValue) {
										downloads = (dbValue) ? window.JSON.parse(dbValue) : { };
										deferred.resolve(/*downloads*/);
									}, deferred.reject);
								}, function() {
									downloads = { };
									deferred.resolve();
								});
							});
						}
					}
				},
				"save": function() {
					if (!IDB) {
						return $.Deferred(function(deferred) {
							var fallback = function(e1) {
									try {
										window.localStorage.setItem(STORAGE_NAME_DOWNLOADS, value);
										deferred.resolve();
									} catch (e) {
										deferred.reject(e);
									}
								}, value = window.JSON.stringify(downloads);

							$.when(hasDB()).then(function() {
								$.when(setInDB(STORAGE_NAME_DOWNLOADS, value, STORAGE_NAME_ALLDOWNLOADS))
									.then(function() {
										try {
											window.localStorage.removeItem(STORAGE_NAME_DOWNLOADS);
											deferred.resolve()
										} catch (e) {
											deferred.reject(e);
										}
									}, fallback);
							}, fallback);
						});
					}
				},
				"store": function(values) {
					if (IDB) {
						return $.when(hasDB()).then(function() {
							// import all the values
						});
					}
					downloads = values;
				},
				"update": function(value) {
					var now = new Date().toISOString(),
						count = $.props(downloads).length - 3,
						size = window.JSON.stringify(downloads).length;

					if (IDB) {
						return $.when(hasDB()).then(function() {
							// update date, count and size
						});
					}
					downloads[VALUE_DOWNLOADS_DATE] = now;
					downloads[VALUE_DOWNLOADS_COUNT] = count;
					downloads[VALUE_DOWNLOADS_SIZE] = size;
				}
			};
		})(),
		_imageLoadQueue = { },
		_infos,
		_isLocal = !!window.location.hostname.match(/localhost/i),
		_keepAliveCount = 0,
		_nextPageCheckTimeout,
		_options = $.extend({ }, _defaults),
		_originalOptions,
		_pageIconManager = (function() {
			var _count,
				_interval,
				_frame,
				icons = $("#favicon")
					.add("#shortcutIcon");

			return {
				"refresh": function(count) {
					// icons.attr("href", (count) ? "../images/loader.gif" : icons.data("icon"));
					if (_count = count) {
						if (!_interval) {
							_frame = 0;
							_interval = window.setInterval(function() {
								var tempCanvas = document.createElement("canvas");

								tempCanvas.width = tempCanvas.height = 192;
								createLoaderImage(tempCanvas, _frame++, (_count > 1) ? _count : String.empty);
								icons.attr({
									"href": tempCanvas.toDataURL()
								});
							}, 200);
						}
					} else {
						icons.attr({
							"href": icons.data("icon")
						});
						if (_interval) {
							window.clearInterval(_interval);
							_interval = undefined;
						}
					}
				}
			};
		})(),
		_readLater,
        _storage = (function() {
			var storage = window[TEMPORARY_STORAGE_TYPE + "Storage"] || window.sessionStorage;

			if (storage === window.localStorage) {
				storage = (function() {
					var getKey = function(key) {
						return [STORAGE_NAME, key].join("_");
					},
					s = storage;

					return {
						"getItem": function(key) {
							return s.getItem(getKey(key));
						},
						"removeItem": function(key){
							s.removeItem(getKey(key));
						},
						"setItem": function(key, val) {
							s.setItem(getKey(key), val);
						}
					};
				})();
			}
			return storage;
		})(),
		_store,
		_textTable,
		_tumblrAuth,
		_usageModes = [{
			"_icon": "home",
			"name": "home_daily",
			"options": {
				  "imageSize": "best"
				, "nsfw": true
				, "theme": 18	/* Sunny */
			}
		}, {
			"_icon": "home-filled",
			"name": "home_nightly",
			"options": {
				  "imageSize": "best"
				, "nsfw": true
				, "theme": 23	/* Vader */
			}
		}, {
			"_icon": "cars",
			"name": "car_daily",
			"options": {
				  "imageSize": "small"
				, "nsfw": true
				, "theme": 7	/* Flick */
			}
		}, {
			"_icon": "car",
			"name": "car_nightly",
			"options": {
				  "imageSize": "small"
				, "nsfw": true
				, "theme": 23	/* Vader */
			}
		}, {
			"_icon": "summer",
			"name": "outside_daily",
			"options": {
				  "imageSize": "small"
				, "nsfw": true
				, "theme": 18	/* Sunny */
			}
		}, {
			"_icon": "moon",
			"name": "outside_nightly",
			"options": {
				  "imageSize": "micro"
				, "nsfw": true
				, "theme": 23	/* Vader */
			}
		}, {
			"_icon": "organization",
			"name": "office",
			"options": {
				  "imageSize": "small"
				, "nsfw": false
				, "theme": 15	/* Smoothness */
			}
		}, {
			"_icon": "close",
			"name": "cancel"
		}],
		_useless;

	var addGlobalUseless = function(useless) {
		openDialog($(".uselessDialog")
			.attr({
				"title": document.title
			})
			.find(".uselessText")
				.val(useless)
			.end(), {
				"buttons": [{
					"click": function(e) {
						var value = $(".uselessDialog").find(".uselessText").val();

						if (value && value.length) {
							value = value.toLowerCase();

							if ($.inArray(value, _useless.map(function(item) {
								return (item.test) ? item.source : item;
							})) < 0) {
								_useless = _useless || [ ];
								_useless.push(value);
								saveGlobalUseless(_useless, true);
							}
							$(this).dialog("close");
						}
					},
					"text": getLocalizedText("ok")
				}, {
					"click": function(e) {
						$(this).dialog("close");
					},
					"text": getLocalizedText("cancel")
				}],
				"destroyOnClose": true,
				"width": "auto"
			});
	};

	var addToReadLater = function(href) {
		if (href && href.length) {
			href = window.location.noProtocol(href).toLowerCase();
			while (href && href.length && href[href.length - 1] === "/") {
				href = href.substr(0, href.length - 1);
			}
			if (href && href.length) {
				return $.when($.confirm(localizedFormat("confirmAddToReadLater", href), undefined, [
					getLocalizedText("yes"),
					getLocalizedText("no")
				])).then(function() {
					var readLater;

					if ($.inArray(href, _readLater) < 0) {
						readLater = _readLater || [ ];
						readLater.push(href);
						return saveReadLater(readLater, true);
					}
				});
			}
		}
		return $.Deferred(function(deferred) {
			deferred.reject();
		}).promise();
	};

	var applyBlogPageOptions = function(skipImages) {
		return $.Deferred(function(deferred) {
			var blog = window.sessionStorage.getItem("blog"),
				blogOptions = getBlogOptions(blog),
				imageSize = getImageSize(window.sessionStorage.getItem("blog")),
				micro = imageSize === "micro",
				pageElement = $("#blogPage"),
				pageWidth = pageElement.width(),
				pageHeight = $(window).height() * 0.8,
				preloadImages = getPreloadImages(blog),
				videos;

			if (!skipImages) {
				_imageLoadQueue = { };
				pageElement.find(".photo").each(function(i, photoElement) {
					var post = (photoElement = $(this)).data("post"),
						index,
						photo,
						selectedPhoto;

					if (post) {
						index = parseInt(photoElement.data("index"));
						photo = post.photos[index];
						selectedPhoto = chooseImage(imageSize, post, index,
							pageWidth, pageHeight);

						if (selectedPhoto.url !== photoElement.attr("src")) {
							photoElement.off().attr({
								"alt": selectedPhoto.url,
								"has-src": String.empty,
								"src": String.empty,
								"title": localizedFormat("size",
									photo.original_size.width,
									photo.original_size.height)
							}).data({
								"src": selectedPhoto.url
							});
							photoElement.css({
								"height": (micro) ? selectedPhoto.height : "auto",
								"min-height": (micro) ? undefined : "1em",
								"width": (micro) ? selectedPhoto.width : "auto",
								"min-width": (micro) ? undefined : "1em"
							});
						}
					}
				});
				pageElement.find(".blogPost")
					.add(pageElement.find(".blogPost img"))
					.add(pageElement.find(".blogPost video"))
					.add(pageElement.find(".blogPost iframe"))
						[(imageSize === "micro") ?
							"addClass" :
							"removeClass"]("micro");
				pageElement.find(".embeddedVideoContainer").each(function(i, videoElement) {
					var post = (videoElement = $(this)).data("post");

					chooseVideoPlayer(imageSize, post,
						pageWidth, pageHeight)
						.addClass("embeddedVideo")
						.appendTo(videoElement.empty());
					videoElement.find("a").each(function(j, item) {
						embedLink($(item));
					});
				});

				var newImageElements = $();
				var imageElements = pageElement
					.find("[has-src]");

				imageElements = imageElements
					.filter(function(i, item) {
						var image = $(item);

						if (image.closest(".newPost").length +
							image.closest(".firstNonNewPost").length) {
							newImageElements = newImageElements.add(image);
						}
						return image.data("src") &&
							!image.attr("src");
					}).each(function(i, item) {
						bindMediaLoading(item);
					});

				if (preloadImages && newImageElements.length) {
					window.setTimeout(function() {
						var waitFors = [ ];

						newImageElements.each(function(i, item) {
							if (!(item = $(item)).closest(".useless").length) {
								var itemPost = item.data("post"),
									postPhotos;

								if (itemPost) {
									if ((postPhotos = itemPost.photos) && postPhotos.length) {
										for (var i = 0; i < postPhotos.length; i++) {
											if (window.location.noProtocol(postPhotos[i].original_size.url) === window.location.noProtocol(item.data("src"))) {
												if (postPhotos[i].alt_sizes && postPhotos[i].alt_sizes.length) {
													item.data({
														"src": chooseImage(imageSize, itemPost, i, pageWidth, pageHeight).url
													});
												}
												break;
											}
										}
									}
								}
								waitFors.push(bindMediaLoading(item, true));
								startLoadingImage(item);
							}
						});
						deferred.resolve();
						$.when.apply(this, waitFors)
							.always(loadNonPreloadedImages);
					}, (window.DEBUG) ? DEBUG_TIMEOUT : 0);
				} else {
					$.when(loadNonPreloadedImages()).always(function() {
						deferred.resolve();
					});
				}
			} else {
				deferred.resolve();
			}

			pageElement.find(".tagsButton")[(_options.showTags && !blogOptions.expandTags) ? "show" : "hide"]();
			pageElement.find(".expandedTag")[(_options.showTags && blogOptions.expandTags) ? "show" : "hide"]();
			pageElement.find(".imageSizesButton")[(_options.showAllImageSizes) ? "show" : "hide"]();
			pageElement.find(".fullScreenButton")[(_options.enableFullScreenViewer) ? "show" : "hide"]();
			pageElement.find(".notes")[(_options.showNotes) ? "show" : "hide"]();
			$(".downloadFileButton").button("option", "icons", {
				"primary": (_options.nativeDownload) ?
					"ui-icon-arrowthickstop-1-s" :
					"ui-icon-extlink"
			});
			$(".downloadFileButton").each(function(i, item) {
				var durationText = (item = $(item).find(".ui-button-text")).html();

				if (!(durationText && durationText.length)) {
					item.html("&nbsp;");
				}
			});
			$(".downloadFileButton2").button("option", "icons", {
				"primary": (_options.nativeDownload) ?
					"ui-icon-extlink" :
					"ui-icon-arrowthickstop-1-s"
			});

			videos = pageElement.find("video")
				.css({
					"max-height": pageHeight + "px"
				});
			bindVideo(videos);
			bindMediaLoading(videos);
			refreshBlogLinks();
		}).promise();
	};

	var applyBlogsOptions = function(dontShowStatus, sortNewBlogs) {
		var avatarSize = tumblr.AVATAR_SIZES[_options.avatarSize],
			blogsElement = $("#blogs"),
			lastElement,
			newBlogsElements = [ ],
			alerts = 0,
			notFound = 0,
			oldBlogs = 0,
			readBlogs = 0;

		$("head")
			.append($(document.createElement("style"))
			.attr({
				"type": "text/css"
			})
			.text(String.format("#blogs .blogTitle { width: {0}px; } " +
				".webui-popover:not(.webui-popover-mainPopoverContent) .webui-popover-content { max-height: {1}px; }",
				parseInt($(".snap-drawer").css("width")) - (avatarSize + 28 + window.scrollbars.height),
				$(window).height() * 0.5)));

		blogsElement.find(".blog").each(function(i, element) {
			var avatarURL,
				customAvatarURL,
				standardAvatarURL,
				blogElement = $(element),
				blogInfo = blogElement.data("info"),
				avatarElement = blogElement.find(".avatar"),
				isVisible = true;

			if (blogInfo.exists) {
				if ((!_options.nsfw && blogInfo.nsfw) ||
					(_options.hideOldies && blogInfo.isOld)) {

					isVisible = false;
				}
				blogElement[(isVisible) ? "show" : "hide"]();
				if (isVisible) {
					avatarURL = blogInfo.avatarURLs[avatarSize];

					if (blogInfo.custom_avatars) {
						avatarElement
							.addClass("customAvatar")
							.data({
								"avatar-url": avatarURL,
								"custom-avatar-url": customAvatarURL = "images/avatars/{0}/{1}.{2}".format(avatarSize,
									blogInfo.name, (blogInfo.custom_avatars.length) ?
										blogInfo.custom_avatars :
										"png")
							})
							.on({
								"mouseenter": function(e) {
									$(e.target).attr({
										"src": $(e.target).data("avatar-url")
									});
								},
								"mouseleave": function(e) {
									$(e.target).attr({
										"src": $(e.target).data("custom-avatar-url")
									});
								}
							});
						avatarURL = customAvatarURL;
					} else {
						avatarElement
							.removeClass("customAvatar")
							.off("mouseenter mouseleave");
					}
					if (avatarElement.attr("src") !== avatarURL) {
						if (blogInfo.nsfw) {
							standardAvatarURL = "images/avatars/standard-nsfw/{0}.png".format(avatarSize);
							avatarElement
								.attr({
									"crossOrigin": "anonymous"
								})
								.one({
									"error": function(e) {
										$(e.target)
											.removeAttr("crossOrigin")
											.attr("src", standardAvatarURL);
									},
									"load": function(e) {
										if (isStandardNSFWTumblrAvatar(this)) {
											$(avatarElement)
												.addClass("standardNSFWAvatar")
												.data({
													"avatar-url": avatarURL,
													"standard-avatar-url": standardAvatarURL
												})
												.on({
													"mouseenter": function(e) {
														$(e.target).attr({
															"src": $(e.target).data("avatar-url")
														});
													},
													"mouseleave": function(e) {
														$(e.target).attr({
															"src": $(e.target).data("standard-avatar-url")
														});
													}
												})
												.attr({
													"alt": standardAvatarURL,
													"src": standardAvatarURL
												});
										}
									}
								});
						}
						avatarElement.on({
							"load": function(e) {
								avatarElement.removeClass("ui-state-error");
							},
							"error": function(e) {
								avatarElement.addClass("ui-state-error");
							}
						}).attr({
							"alt": avatarURL,
							"src": avatarURL
						}).css({
							"height": avatarSize,
							"width": avatarSize
						});
					}
					if (blogElement.hasClass("oldBlog")) {
						oldBlogs++;
					} else if (blogElement.hasClass("newBlog")) {
						newBlogsElements.push(blogElement);
					} else {
						readBlogs++;
					}
				}
			} else {
				if (blogInfo.isOld) {
					blogElement[(_options.hideOldies && typeof blogInfo.blog.data.disabled === "boolean") ? "hide" : "show"]();
					oldBlogs++;
				}
				if (blogInfo.isAlert) {
					alerts++;
				} else if (typeof blogInfo.blog.data.disabled !== "string") {
					notFound++;
				}
			}
		});
		blogsElement
			.find(".alertBlogsHeader")
			.find(".text")
			.first()
			.text(localizedFormat("notFoundBlogs", alerts));
		if (sortNewBlogs) {
			sortBlogs(newBlogsElements, true);
			lastElement = blogsElement
				.find(".newBlogsHeader");
			$(newBlogsElements).each(function(i, element) {
				lastElement.after(element);
				lastElement = element;
			});
		}
		blogsElement
			.find(".readBlogsHeader")
			.find(".text")
			.first()
			.text(localizedFormat("readBlogs", readBlogs));
		blogsElement
			.find(".oldBlogsHeader")
			.find(".text")
			.first()
			.text(localizedFormat("oldBlogs", oldBlogs))
			.end()
			.end()
			[(!_options.hideOldies) ? "show" : "hide"]();
		blogsElement
			.find(".notFoundBlogsHeader")
			.find(".text")
			.first()
			.text(localizedFormat("notFoundBlogs", notFound));
		refreshBlogList();
		if (!dontShowStatus) {
			showNewBlogsStatus(function(e) {
				if ((e.newBlogs || e.newPosts) &&
					!window.sessionStorage.getItem("blog") &&
					!$(e.target).closest(".toast").hasClass("noSnapperOnClick")) {

					window.setTimeout(function() {
						$(".snapper").trigger("click");
					});
				}
			});
		}
	};

	var applyOptions = function(newOptions) {
		var previousOptions = $.extend({ }, _options);

		_options = newOptions;
		saveOptions();
		applyPageOptions();
		if (newOptions.avatarSize !== previousOptions.avatarSize ||
			newOptions.hideOldies !== previousOptions.hideOldies ||
			newOptions.sortByPosts !== previousOptions.sortByPosts ||
			newOptions.nsfw !== previousOptions.nsfw) {

			applyBlogsOptions(newOptions.hideOldies === previousOptions.hideOldies &&
				newOptions.nsfw === previousOptions.nsfw,
				newOptions.sortByPosts !== previousOptions.sortByPosts);
		}
		if (newOptions.showMissingDownloads !== previousOptions.showMissingDownloads) {
			refreshDownloadsButtons();
		}
		if (newOptions.postType !== previousOptions.postType) {
			window.sessionStorage.removeItem("blogPage");
			window.sessionStorage.removeItem("blogTag");
			window.sessionStorage.removeItem("blogPostType");
			loadLastBlog();
		} else if (newOptions.postsPerPage !== previousOptions.postsPerPage ||
			newOptions.embedLinks !== previousOptions.embedLinks ||
			newOptions.embedVideos !== previousOptions.embedVideos ||
			newOptions.customGifControls !== previousOptions.customGifControls) {

			if (newOptions.postsPerPage !== previousOptions.postsPerPage) {
				var blog = window.sessionStorage.getItem("blog"),
					info,
					pageIndex = parseInt(window.sessionStorage.getItem("blogPage"));

				if (blog && !isNaN(pageIndex)) {
					$(_infos).each(function(i, item) {
						if (item.url === blog) {
							info = item;
							return false;
						}
					});

					pageIndex = Math.floor(pageIndex *
						parseFloat(previousOptions.postsPerPage) /
						parseFloat(newOptions.postsPerPage));

					if (info) {
						info.page = pageIndex;
					}
					window.sessionStorage.setItem("blogPage", pageIndex);
				} else {
					window.sessionStorage.removeItem("blogPage");
				}
			}
			loadLastBlog();
		} else if (newOptions.imageSize !== previousOptions.imageSize ||
			(newOptions.preloadImages !== previousOptions.preloadImages && newOptions.preloadImages) ||
			newOptions.enableFullScreenViewer !== previousOptions.enableFullScreenViewer ||
			newOptions.showTags !== previousOptions.showTags ||
			newOptions.showAllImageSizes !== previousOptions.showAllImageSizes ||
			newOptions.showNotes !== previousOptions.showNotes ||
			newOptions.nativeDownload !== previousOptions.nativeDownload ||
			newOptions.customVideoControls !== previousOptions.customVideoControls) {

			applyBlogPageOptions(!(newOptions.imageSize !== previousOptions.imageSize ||
				(newOptions.preloadImages !== previousOptions.preloadImages && newOptions.preloadImages)));
		}
	};

	var applyPageOptions = function() {
		$(document.body)[(_options.peekMode) ?
			"addClass" :
			"removeClass"]("peekMode");
	};

	var autoHide = function(blog, html) {
		if (blog &&
			blog.data &&
			blog.data.hide &&
			blog.data.hide.length) {

			$(blog.data.hide).each(function(i, item) {
				try {
					html = html.replace(new RegExp(item, "i"), function(found, i, expression) {
						return "<div class=\"autoHide\">" + found + "</div>";
					});
				} catch (e) { }
			});
		}
		return html;
	};

	var bindMediaLoading = function(imageOrVideo, eventsOnly) {
		if ((imageOrVideo = $(imageOrVideo)).length > 1) {
			imageOrVideo.each(function(i, item) {
				bindMediaLoading(item, eventsOnly);
			});
		} else if (imageOrVideo.is("video")) {
			imageOrVideo.on({
				"play": function(e) {
					var sourcePost = $(e.target).closest(".blogPost").data("post"),
						url;

					if (sourcePost) {
						url = sourcePost.video_url;
					}
					if (!(url && url.length)) {
						url = $(this).attr("src");
					}
					if (url && url.length) {
						setFileDownloaded(url, sourcePost);
					}
				}
			});
		} else {
			return $.Deferred(function(deferred) {
				var target = getMediaTargetElement(imageOrVideo);

				if (!eventsOnly) {
					target.off(".loader");
				}
				target.on({
					"error.loader": function(e) {
						if (!eventsOnly && imageOrVideo.attr("src")) {
							imageOrVideo.removeClass("ui-state-highlight")
								.addClass("lazyLoaded")
								.addClass("transitionable")
								.removeClass("loading")
								.addClass("ui-state-error");
							setPostLoading(imageOrVideo);
							dequeueImageLoad(target);
						}
						deferred.reject();
					},
					"load.loader": function(e) {
						if (!eventsOnly) {
							imageOrVideo.removeClass("ui-state-error")
								.removeClass("ui-state-highlight")
								.addClass("lazyLoaded")
								.addClass("transitionable")
								.addClass("loaded")
								.removeClass("loading");
							setPostLoading(imageOrVideo);
							dequeueImageLoad(target, true);
						}
						deferred.resolve();
					}
				});
			}).promise();
		}
	};

	var bindVideo = function(videos) {
		if (_options.customVideoControls) {
			videos
				.video()
				.on({
					"mutechanged volumechanged": function(e) {
						if (e.target.muted) {
							try {
								_storage.removeItem("videoUnmuted");
							} catch (e) { }
						} else {
							try {
								_storage.setItem("videoUnmuted", true);
							} catch (e) { }
						}
						try {
							_storage.setItem("videoVolume", e.target.volume.toString());
						} catch (e) { }
					},
					"play durationchange": function(e) {
						try {
							e.target.muted = !_storage.getItem("videoUnmuted");
						} catch (e) { }
						try {
							e.target.volume = parseFloat(_storage.getItem("videoVolume"));
						} catch (e) { }
						$(e.target).video("update");
					}
				});
		} else {
			videos
				.video("destroy")
				.attr({
					"controls": true
				});
		}
	};

	var chooseImage = function(imageSize, post, photoIndex, width, height, fullScreen) {
		var image,
			index,
			sizes;

		if (!fullScreen) {
			if (isAnimated(post.photos[photoIndex].original_size.url)) {
				if (post.photos.length > 3) {
					width /= 3;
				}
				height = height * 0.8;
			} else {
				switch (imageSize) {
					case "best":
						height = 0;
						break;
				}
			}
		}

		index = post.getBestFitPhotoIndex(photoIndex, width, height);
		sizes = post.photos[photoIndex].alt_sizes;

		if (fullScreen) {
			switch (imageSize) {
				case "best":
					image = post.photos[photoIndex].original_size;
					break;
				case "small":
					if (index > 0) {
						index--;
					}
					break;
				default:
					if ($.isPlainObject(imageSize)) {
						return imageSize;
					}
					break;
			}
		} else {
			switch (imageSize) {
				case "best":
					if (index > 0) {
						index--;
					}
					break;
				case "micro":
					index = sizes.length - 1;
					break;
			}
		}
		return image || sizes[index];
	};

	var chooseVideoPlayer = function(imageSize, post, width, height, fullScreen) {
		var code, i, index = 0, player, playerHeight;

		if (fullScreen || imageSize !== "micro") {
			if (fullScreen && imageSize === "best") {
				index = post.player.length - 1;
			} else {
				index = 0;
				for (i = post.player.length - 1; i >= 0; i--) {
					playerHeight = parseInt($(sameSource(post.player[i].embed_code)).attr("height")) || 0;
					if (post.player[i].width <= width &&
						(!playerHeight || playerHeight <= height)) {
						index = i;
						break;
					}
				}
				if (fullScreen || imageSize === "best") {
					if (index < post.player.length - 1) {
						index++;
					}
				}
			}
		}
		if ((code = post.player[index].embed_code) && code.length) {
			try {
				player = $(sameSource(code));
			} catch (e) {
				player = $(document.createElement("video"))
					.attr("src", post.video_url);
			}
			if (player.is("video")) {
				player.attr({
					"controls": true
				});
				if (post.video_url && post.video_url.length) {
					player.data({
						"post": post
					});
				}
			}
			player.find("a").add((player.is("a")) ?
				player :
				undefined).attr({
					"target": "_blank"
				});
		}
		return player || $();
	};

	var clearBlogPage = function(postsOnly) {
		scrollContentToTop();

		if (_nextPageCheckTimeout) {
			window.clearTimeout(_nextPageCheckTimeout);
			_nextPageCheckTimeout = 0;
		}
		if (!postsOnly) {
			$(".blogHeader").hide();
			$(".blogPageTitle").empty();
			$(".blogNavigator").hide();
		}
		$("#blogPage")
			.empty()
			.removeData("posts");
		_imageLoadQueue = { };
		setDocumentLoading(0);
	};

	var clearSession = function() {
		window.sessionStorage.removeItem("blog");
		window.sessionStorage.removeItem("blogLoginRequired");
		window.sessionStorage.removeItem("blogPage");
		window.sessionStorage.removeItem("blogTag");
		window.sessionStorage.removeItem("blogPostType");
		window.sessionStorage.removeItem("blogTitle");
		window.sessionStorage.removeItem("startupDates");
		window.sessionStorage.removeItem("dates");
		window.sessionStorage.removeItem("blogInfos");
		_dates = undefined;
	};

	var createDownloadInfoButton = function(appendTo, post) {
		var downloadFileName = getDownloadFileName(post),
			downloadInfoButton = $(document.createElement("a"))	/* 'A' button: OK */
			.addClass("downloadInfoButton")
			.attr({
				"download": downloadFileName,
				"href": post.download_url,
				"target": "_blank"
			})
			.on({
				"click": function(e) {
					e.preventDefault();
				}
			})
			.button({
				"icons": {
					"primary": "ui-icon-info"
				},
				"text": false
			})
			.appendTo(appendTo);
		downloadInfoButton.after($(document.createElement("span"))
			.addClass("webui-popover-content")
			.attr({
				"downloadURL": post.download_url,
				"downloadTitle": getDownloadTitle(post)
			})
			.append($(document.createElement("button"))
				.addClass("setDownload")
				.attr({
					"type": "button"
				})
				.data({
					"popover": downloadInfoButton,
					"post": post
				})
				.on({
					"click": function(e) {
						var target = $(e.target).closest(".ui-button"),
							post = target.data("post");

						target.data("popover").webuiPopover("hide");
						setFileDownloaded(post.download_url, post);
					}
				})
				.button({
					"icons": {
						"primary": "ui-icon-check"
					},
					"text": false
				}))
			.append($(document.createElement("button"))
				.addClass("resetDownload")
				.attr({
					"type": "button"
				})
				.data({
					"popover": downloadInfoButton,
					"post": post
				})
				.on({
					"click": function(e) {
						var target = $(e.target).closest(".ui-button"),
							post = target.data("post");

						target.data("popover").webuiPopover("hide");
						setFileDownloaded(post.download_url, post, false, true);
					}
				})
				.button({
					"icons": {
						"primary": "ui-icon-cancel"
					},
					"text": false
				}))
			.append($(document.createElement("a"))	/* 'A' button: OK */
				.addClass("downloadFileButton2")
				.attr({
					"download": downloadFileName,
					"href": post.download_url,
					"target": "_blank",
					"title": getDownloadTitle(post)
				})
				.data({
					"popover": downloadInfoButton,
					"post": post
				})
				.on({
					"click": function(e) {
						var target = $(e.target).closest(".ui-button"),
							post = target.data("post");

						target.data("popover").webuiPopover("hide");
						if (_options.nativeDownload) {
							e.preventDefault();
							_downloadManager.downloadPost(post);
						}
					}
				})
				.button({
					"icons": {
						"primary": (_options.nativeDownload) ?
							"ui-icon-extlink" :
							"ui-icon-arrowthickstop-1-s"
					},
					"text": false
				})));
		downloadInfoButton
			.find(".ui-button-text")
			.html("&nbsp;")
			.end()
			.webuiPopover({
				"animation": "fade",
				"onShow": function(target) {
					$.when(isFileDownloaded($(target)
						.find("[downloadURL]")
						.attr("downloadURL"))).then(function(downloaded) {
							target
								.addClass("ui-widget-content")
								.css({
									"background-color": $("#content").css("background-color")
								});
							target
								.find(".webui-popover-title")
								.html(replaceHTMLNewLines($(target)
									.find("[downloadTitle]")
									.attr("downloadTitle")));
							target
								.find(".setDownload")
								.add(target
									.find(".downloadFileButton2"))[(downloaded) ?
										"addClass" :
										"removeClass"]("downloaded");
							target
								.find(".resetDownload")[(downloaded) ?
									"removeClass" :
									"addClass"]("downloaded");
						});
				},
				"width": Math.max($(window).width() * 0.25, 180)
			});
		return downloadInfoButton;
	};

	var createGIFPlayer = function(image, url) {
		var parent = (image = $(image)).parent();

		if (!(url && url.length)) {
			url = image.data("src");
		}
		if (!parent.attr("id")) {
			parent.attr({
				"id": "_" + window.guid()
			});
		}
		image.attr({
			"rel:animated_src": getProxiedURL(url)
		});
		parent.on({
			"click": function(e) {
				e.preventDefault();
			}
		});
		lc_gif_player("#" + parent.attr("id"), true,
			String.empty, [ "fullscreen" ])
	};

	var createLinkMenu = function(link) {
		var buttonClass, href, items, path, useless;

		path = (href = window.location.noProtocol((link = $(link)).attr("href"))).split("/");

		if (path[0].match(/.tumblr./i)) {
			if (href.match(/.tumblr.com\/blog\/view\//i)) {
				href = path[3] + ".tumblr.com";
				/* path.length = 4;
				useless = path.join("/"); */
				useless = href;
			} else if (href.match(/www.tumblr.com\//i)) {
				href = path[1] + ".tumblr.com";
				useless = href;
			} else {
				useless = href = path[0];
			}
			items = [{
				"attr": {
					"title": getLocalizedText("blogStatistics")
				},
				"click": function(e) {
					showBlogStatistics(href);
				},
				"icon": "ui-icon-info"
			}, {
				"attr": {
					"href": window.tumblr.getArchiveURL(href),
					"title": getLocalizedText("archive")
				},
				"dontPrevent": true,
				"icon": "ui-icon-suitcase"
			}, {
				"attr": {
					"title": getLocalizedText("view")
				},
				"click": function(e) {
					$.when(findBlog(href)).then(function(info) {
						loadBlog(info);
					});
				},
				"icon": "ui-icon-search"
			}];

			if (isUseless(useless)) {
				link.addClass("useless-link");
				items.push({
					"attr": {
						"title": getLocalizedText("removeUseless")
					},
					"click": function(e) {
						removeGlobalUseless(useless);
					},
					"icon": "ui-icon-circle-check"
				});
			} else {
				items.push({
					"attr": {
						"title": getLocalizedText("addUseless")
					},
					"click": function(e) {
						addGlobalUseless(useless);
					},
					"icon": "ui-icon-circle-close"
				});
			}
			if ($.inArray(href, $(_dates).props()) < 0) {
				items.push({
					"attr": {
						"title": getLocalizedText("addBlog")
					},
					"click": function(e) {
						$.when($.confirm(localizedFormat("confirmAddBlog", href), undefined, [
							getLocalizedText("yes"),
							getLocalizedText("no")
						])).then(function() {
							setBlogEntry(href, {
								"url": href
							});
						});
					},
					"icon": "ui-icon-star"
				});
				items.push({
					"attr": {
						"title": getLocalizedText("addToReadLater")
					},
					"click": function(e) {
						addToReadLater(href);
					},
					"icon": "ui-icon-clock"
				});
			} else {
				buttonClass = "ui-state-highlight";
			}
			if (items.length === 6) {
				items[3].wrap = true;
			}
			link.addClass("blogLink").after(createPopoverButton({
				"icon": "ui-icon-triangle-1-s",
				"items": items
			}).addClass(buttonClass));
		}
	};

	var createLoaderImage = function(canvas, frame, count, color) {
		var width = canvas.width,
			height = canvas.height,
			context = canvas.getContext("2d");

		//context.reset();
		context.clearRect(0, 0, width, height);

		/*
		context.fillStyle = "white";
		context.fillRect(0, 0, width, height);
		context.fillStyle = "black";
		*/

		var N = 12,
			r = 30,
			g = 144,
			b = 255;

		frame %= N;
		for (var i = 0; i < N; i++) {
			var a = i / (N - 1);

			context.translate(width / 2, height / 2);
			context.rotate((frame + i) / N * 2 * Math.PI);
			context.translate(width / 3.5, -height / 40);
			context.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
			context.fillRect(0, 0, width / 7, height / 15);
			context.strokeRect(0, 0, width / 7, height / 15);
			context.resetTransform();
		}

		context.fillStyle = color || "rgba(255, 255, 255, 0.75)";
		context.textAlign = "center";
		context.textBaseline = "top";

		var text = count.toLocaleString(),
			textMaxWidth = width * 0.75,
			textMaxHeight = height * 0.75;

		var bounds,
			size = Math.min(textMaxWidth, textMaxHeight);

		size++;
		do {
			size--;
			context.font = (--size) + "px sans serif";
			bounds = context.measureText(text);
			bounds.height = bounds.actualBoundingBoxDescent - bounds.actualBoundingBoxAscent;
		} while (bounds.height >= textMaxHeight || bounds.width >= textMaxWidth);

		context.fillText(text, width / 2, height / 2 - bounds.height / 2);
	};

	var createPopoverButton = function(options) {
		options = options || { };

		var button = $(document.createElement("button"))
			.addClass("popoverButton")
			.addClass(options.className)
			.attr({
				"type": "button"
			})
			.button({
				"icons": {
					"primary": options.icon || "ui-icon-info"
				},
				"label": options.title,
				"text": !!(options.title && options.title.length)
			}),
			contentElement = $(document.createElement("div"))
				.addClass("noSnapperOnClick")
				.addClass((options.text) ? "textPopover" : undefined)
				.on({
					"click": function(e) {
						if ($(e.target).closest("a").length === 0 ||
							$(e.target).closest("a").attr("href") === "#") {

							return e.preventAll();
						}
					}
				}),
			createItems = function(parent, items) {
				$(items).each(function(i, item) {
					var itemElement;

					if ($.isFunction(item)) {
						itemElement = item();
					} else if (item.type && item.type.length && item.type !== "button") {
						itemElement = item;
					} else if (item.items && item.items.length) {
						parent.append($(document.createElement("div"))
							.addClass("popTitle")
							.text(item.text));
						createItems(itemElement = $(document.createElement("div")), item.items);
					} else {
						itemElement = $(document.createElement((options.text || item.dontPrevent) ?
								"a" :
								"button"))
							.addClass((options.text) ? undefined : "popoverInnerButton")
							.addClass(item.className);
						itemElement
							.attr($.extend({
								"href": (itemElement.is("a")) ? "#" : undefined,
								"type": (itemElement.is("a")) ? undefined : "button"
							}, item.attr))
							.data($.extend({ }, item.data, {
								"popoverItem": item,
								"parentPopover": button
							}))
							.on({
								"click": function(e) {
									var target = $(e.target).closest(".popoverInnerButton"),
										popoverItem = target.data("popoverItem");

									if (!popoverItem.keepOpen) {
										target.data("parentPopover").webuiPopover("hide");
									}
									if (!popoverItem.dontPrevent) {
										e.preventDefault();
									}
									if (popoverItem.click) {
										return popoverItem.click(e);
									}
								}
							});
						if (itemElement.is("a") &&
							item.dontPrevent) {

							embedLink(itemElement);
						}
						if (options.text) {
							itemElement.text(item.text);
						} else {
							itemElement.button({
									"icons": {
										"primary": item.icon || "ui-icon-info"
									},
									"label": item.text,
									"text": !!(item.text && item.text.length)
								});
						}
					}
					if ($.isPlainObject(item) && item.wrap) {
						parent.append($(document.createElement("br")));
					}
					parent.append((options.text) ?
						$(document.createElement("div"))
							.addClass("popoverInnerButton")
							.data(itemElement.data())
							.append((item.icon && item.icon.length) ?
								$(document.createElement("span"))
									.append($(document.createElement("i"))
										.addClass("ui-icon")
										.addClass(item.icon)) :
										undefined)
							.append($(document.createElement("div"))
								.append(itemElement)) :
						itemElement);
				});
			};

		if (options.popTitle && options.popTitle.length) {
			contentElement.append($(document.createElement("div"))
				.addClass("popTitle")
				.text(options.popTitle));
		}
		createItems(contentElement, options.items);
		return button.webuiPopover({
			"animation": "fade",
			"content": contentElement,
			"onShow": function(target) {
				$(target)
					.addClass("ui-widget-content")
					.css({
						"background-color": $("#content").css("background-color")
					});
				if (options.onShow) {
					options.onShow(target);
				}
			},
			"width": "auto"
		});
	};

	var createTumblr = function() {
		var t = new window.tumblr(_tumblrAuth);

		t.proxy = getProxy();
		return t;
	};

	var dequeueImageLoad = function(image, success) {
		var hostName = image.data("hostName"),
			host,
			key = image.data("queueKey"),
			entry,
			now = $.now();

		if (hostName && hostName.length && key && key.length) {
			entry = (host = _imageLoadQueue[hostName])[key];

			/* window.console[(success) ? "info" : "error"]("Host [{0}], ({1}, {2}): {3} ({4}) - ended on {5} ({6} elapsed){7}"
				.format(host.name, host.count, host.loading,
					entry.key, entry.src.split("/").pop(), new Date(now).toLocaleString(), getDateInterval(now - entry.started), (entry.deferred) ?
						" (deferred for {0}, total time {1})".format(getDateInterval(entry.started - entry.enqueued), getDateInterval(now - entry.enqueued)) :
						String.empty)); */

			image.data({
				"deferTime": (entry.deferred) ?
					entry.started - entry.enqueued :
					undefined,
				"loadTime": now - entry.started,
				"totalTime": (entry.deferred) ?
					now - entry.enqueued :
					undefined
			});
			delete host[key];
			host.count--;
			host.loading--;
			if (host.count && host.loading < POOL_SIZE) {
				$(host).eachProp(function(name, value) {
					if ($.isPlainObject(value) && !value.loading) {
						loadImageEntry(value, host);
						return false;
					}
				});
			}
		}
	};

	var embedLink = function(link) {
		if ((link = $(link)).length) {
			link.attr({
				"target": "_blank"
			});
			if (_options.embedLinks) {
				link.on({
					"click": function(e) {
						var target = $(e.target).closest("a"),
							title = target.text() || target.attr("title") || document.title,
							url = target.attr("href");

						if (url && url.length) {
							if (e.which === 1 && _options.embedLinks) {
								showLink(url, title);
								return e.preventAll();
							}
						} else {
							return e.preventAll();
						}
					}
				});
			}
		}
		return link;
	};

	var enqueueImageLoad = function(image, src) {
		var entry = {
				"enqueued": $.now(),
				"image": image,
				"key": window.guid(),
				"src": src
			},
			host,
			hostName = window.location.noProtocol(src).split("/")[0];

		if (!_imageLoadQueue[hostName]) {
			_imageLoadQueue[hostName] = {
				"count": 0,
				"loading": 0,
				"name": hostName
			};
		}
		host = _imageLoadQueue[hostName];
		host[entry.key] = entry;
		if (++host.count <= POOL_SIZE) {
			loadImageEntry(entry, host);
		} else {
			entry.deferred = true;
		}
	};

	var escapeRegExp = function(s) {
		return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	};

	var findBlog = function(url) {
		return $.Deferred(function(deferred) {
			var t = createTumblr(),
				blog = t.getBlog(_dates[url = window.location.noProtocol(url).toLowerCase()] || url);

			$.when(blog.getInfo()).then(function(info) {
				if (info.exists) {
					info.blog = blog;
					deferred.resolve(info);
				} else {
					if (!isInMyBlogs({
						"url": blog.url
					}) && t.isLoginSupported) {
						$.when(blog.getInfo(true)).then(function(newInfo) {
							if (newInfo.exists) {
								newInfo.blog = blog;
								deferred.resolve(newInfo);
							} else {
								$.toast.error(localizedFormat("blogNotFound", info.name));
								deferred.reject();
							}
						}, deferred.reject);
					} else {
						$.toast.error(localizedFormat("blogNotFound", info.name));
						deferred.reject();
					}
				}
			}, deferred.reject);
		}).promise();
	};

	var getBlogEntry = function(url, sessionEntry) {
		var key = getBlogKey(url),
			sessionDates;

		if (sessionEntry) {
			sessionDates = window.sessionStorage.getItem("startupDates");

			if (sessionDates && sessionDates.length) {
				sessionDates = $.parseJSON(window.decodeURIComponent(sessionDates));

				if (sessionDates[key]) {
					return sessionDates[key];
				}
			}
			return undefined;
		}
		return (_dates || { })[key];
	};

	var getBlogKey = function(url) {
		var key = window.location.noProtocol(url);

		while (key.length && key[key.length - 1] === "/") {
			key = key.substr(0, key.length - 1);
		}
		return key;
	};

	var getBlogOptions = function(url) {
		var options = (getBlogEntry(url) || { }).options || String.empty;

		if (options) {
			if (!$.isPlainObject(options) && options.length) {
				options = $.parseJSON(window.decodeURIComponent(options));
			}
			return options;
		}
		return { };
	};

	var getBlogPageScroller = function() {
		return $(($("#content").css("overflow") === "visible") ?
			"#blogPageContainer" :
			"#content");
	};

	var getDateInterval = function(interval, roundUp) {
		if (roundUp && interval > 0) {
			interval = Math.max(interval, 1e3);
		}
		return window.formatDateInterval(interval, _textTable.dateIntervalOptions);
	};

	var getDateIntervalFromNow = function(interval) {
		var inTheFuture;

		if (inTheFuture = (interval = interval || 0) < 0) {
			interval = -interval;
		}
		if (interval > 0) {
			return localizedFormat((inTheFuture) ?
				"fromNow" :
				"ago", getDateInterval(interval));
		} else {
			return getLocalizedText("now");
		}
	};

	var getDownload = function(downloadURL) {
		var download,
			i,
			k,
			key,
			parts,
			url;

		url = window.location.noProtocol(downloadURL);

		if (!(download = _downloads.get(key = _store.getKey(url)))) {
			download = _downloads.get(key = _store.getKey(url).replace(/%20/gi, " "));
		}
		if (download) {
			return $.extend({ }, download, {
				"key": key
			});
		}
		parts = _store.getKey(url).split(/[_\W]/);
		while (parts.length && parts[0].toLowerCase() !== "tumblr") {
			parts.splice(0, 1);
		}
		if (parts.length) {
			key = _store.getKey(parts.join("/"));
			for (i = 0; i < DOWNLOAD_SERVERS.length; i++) {
				if (download = _downloads.get(k = _store.getKey(DOWNLOAD_SERVERS[i] + "/" + key))) {
					return $.extend({ }, download, {
						"key": k
					});
				}
			}
		}
	};

	var getDownloadFileName = function(post, downloadURL) {
		return getDownloadName(post, downloadURL, "fileName");
	};

	var getDownloadName = function(post, downloadURL, type) {
		var blog = post.blog || _dates[getBlogKey(window.location.noProtocol(post.post_url).split("/")[0])],
			download,
			ellipsisText = function(text, length) {
				var ellipsis = "...";

				if (length > ellipsis.length) {
					if ((text = text || String.empty).length > length) {
						text = text.substr(0, length - ellipsis.length) + ellipsis;
					}
				}
				return text;
			},
			extension = String.empty,
			fileName,
			index,
			isFileName = type === "fileName",
			maxSummary,
			maxTitle,
			simpleName/* = post.type === "photo" */,
			summary,
			title,
			useSummary;

		downloadURL = downloadURL || post.download_url;
		fileName = window.location.noHash(downloadURL.split("/").pop());
		if (!isFileName && isFileDownloaded(downloadURL)) {
			download = getDownload(downloadURL);
		}
		if (!simpleName) {
			if ((index = fileName.lastIndexOf(".")) >= 0) {
				if ((extension = fileName.substr(index)).length) {
					fileName = fileName.substr(0, fileName.length - extension.length);
				}
			}
			if (isFileName) {
				title = validateFileName(blog.title);
			}
			if (post && (summary = post.summary) && summary.length) {
				if (blog && blog.download_filters && blog.download_filters.length) {
					$(blog.download_filters).each(function(i, filter) {
						summary = $.trim(summary.replace(new RegExp(filter, "i"), String.empty));
					});
				}
				useSummary = !!summary.length;
			}
			if (useSummary) {
				maxTitle = (MAXIMUM_DOWNLOAD_FILENAME - fileName.length) -
					(maxSummary = (MAXIMUM_DOWNLOAD_FILENAME - fileName.length) * 2 / 3);
				fileName = localizedFormat((title && title.length) ? "threeFrom" : "two3",
					ellipsisText(summary[0].toUpperCase() + summary.substr(1), maxSummary),
					fileName, ellipsisText(title, maxTitle));
			} else if (title && title.length) {
				fileName = localizedFormat("twoFrom", fileName, title);
			}
			if (download && type === "title") {
				fileName = localizedFormat((download.auto) ?
					"alreadyAutomaticallyDownloadedFrom" :
					"alreadyDownloadedFrom",
						fileName, (download.source && download.source.length) ?
							download.source :
							getLocalizedText("unknown"),
						new Date(download.downloaded));
			}
		}
		return (isFileName) ?
			validateFileName(fileName + extension) :
			fileName;
	};

	var getDownloadText = function(post, downloadURL) {
		return getDownloadName(post, downloadURL, "text");
	};

	var getDownloadTitle = function(post, downloadURL) {
		return getDownloadName(post, downloadURL, "title");
	};

	var getImageSize = function(url, noOverride) {
		if (url && url.length) {
			if (!noOverride) {
				var options;

				options = getBlogOptions(url);
				if (options &&
					options.imageSize &&
					options.imageSize.length) {

					return options.imageSize;
				}
			}
			if (OFFICE_MODE !== 0) {
				var nsfw = false;

				$(_infos).each(function(i, info) {
					if (info.url && info.url.length && info.url === url) {
						nsfw = info.nsfw;
						return false;
					}
				});
				if (nsfw) {
					return "micro";
				}
			}
		}
		return _options.imageSize;
	};

	var getLastSeenDate = function(url, sessionDate) {
		return new Date((getBlogEntry(url, sessionDate) || { }).seen || 0);
	};

	var getLastSeenPosts = function(url, sessionPosts) {
		return (getBlogEntry(url, sessionPosts) || { }).seenPosts || 0;
	};

	var getLastUpdatedDate = function(url, sessionDate) {
		return new Date((getBlogEntry(url, sessionDate) || { }).date || 0);
	};

	var getLastViewedDate = function(url, sessionDate) {
		return new Date((getBlogEntry(url, sessionDate) || { }).viewed || 0);
	};

	var getLastViewedPosts = function(url, sessionPosts) {
		return (getBlogEntry(url, sessionPosts) || { }).posts || 0;
	};

	var getLastViewedTitle = function(url, sessionTitle) {
		return (getBlogEntry(url, sessionTitle) || { }).title;
	};

	var getLocalizedText = function(textID) {
		var o = _textTable;

		textID = textID.split(".");
		for (var i = 0; i < textID.length - 1; i++) {
			o = o[textID[i]];
		}
		return o[textID.pop()] || String.empty;
	};

	var getMediaTargetElement = function(sourceElement) {
		var target;

		if (!(target = sourceElement = $(sourceElement)).is("img")) {
			if (!(target = sourceElement.closest("audio")).length) {
				if (!(target = sourceElement.closest("video")).length) {
					target = sourceElement;
				}
			}
		}
		return target;
	};

	var getPostCount = function(info) {
		var postType = window.sessionStorage.getItem("blogPostType");

		if (!(postType && postType.length)) {
			postType = _options.postType;
		}
		if (postType && postType.length) {
			return (info.posts_per_type || { })[postType] || 0;
		}
		return info.posts;
	};

	var getPostTypeImage = function(post) {
		var className;

		switch (post.type) {
			case "photo":
				className = "image";
				break;
			case "video":
				className = "video";
				break;
			case "text":
				className = "text";
				break;
			case "answer":
				className = "help";
				break;
			case "quote":
				className = "comment";
				break;
			case "link":
				className = "link";
				break;
			case "chat":
				className = "person";
				break;
			case "audio":
				className = "volume-on";
				break;
			default:
				className = "alert";
				break;
		}
		if (className && className.length) {
			return $(document.createElement("span"))
				.addClass("postImage")
				.addClass("ui-icon")
				.addClass("ui-icon-" + className);
		}
	};

	var getPreloadImages = function(url) {
		if (url && url.length) {
			var options;

			options = getBlogOptions(url);
			if (options &&
				options.preloadImages &&
				options.preloadImages.length) {

				switch (options.preloadImages) {
					case "preload":
						return true;
					case "dontPreload":
						return false;
				}
			}
		}
		return _options.preloadImages;
	};

	var getProxiedURL = function(url) {
		var proxy = getProxy();

		return window.location.sameProtocol(proxy.url.format(window.location[(proxy.noProtocol) ? "noProtocol" : "sameProtocol"](url)));
	};

	var getProxy = function() {
		return PROXIES[(!NO_LOCAL_PROXY_ON_LOCALHOST && _isLocal) ?
			"local" :
			"remote"];
	};

	var getRequestFullScreen = function(element) {
		return element.requestFullscreen ||
			element.mozRequestFullScreen ||
			element.webkitRequestFullscreen;
	};

	var hideStatus = function() {
		return $.toast({
			"close": true,
			"toast": ".statusToast"
		});
	};

	var isADialogOpen = function() {
		var isOpen = false;

		$(".ui-dialog-content").each(function(i, dialogElement) {
			if ($(dialogElement).dialog("isOpen")) {
				isOpen = true;
				return false;
			}
		});
		return isOpen;
	};

	var isAnimated = function(url) {
		return !!url.match(/\.gif$|\.apng$/i);
	};

	var isFileDownloaded = function(url, ref) {
		var download = getDownload(url);

		if (ref) {
			ref.download = download;
		}
		return !!download;
	}

	var isInMyBlogs = function(info) {
		var isInBlogs = function(url) {
			return $.inArray(window.location.noProtocol(url).split("/")[0], $(_dates).props()) >= 0
		};

		if (isInBlogs(info.url)) {
			return true;
		}
		if (info.blogURL && info.blogURL.length) {
			return isInBlogs(info.blogURL);
		}
	};

	var isInMyReadLater = function(url) {
		return $.inArray(window.location.noProtocol(url).split("/")[0].toLowerCase(), _readLater || [ ]) >= 0;
	};

	var isSlidePost = function(post) {
		switch (post.type) {
			case "audio":
			case "photo":
				return true;
			case "video":
				return post.html5_capable;
			default:
				return post.photos && post.photos.length;
		}
	};

	var isStandardNSFWTumblrAvatar = function(img) {
		var canvas = document.createElement("canvas"),
			color = [ 238, 238, 238 ],
			context = canvas.getContext("2d"),
			height = img.naturalHeight,
			isBackgroundPixel = function(offset) {
				offset *= 4;
				for (var j = 0; j < color.length; j++) {
					if (pixels[offset + j] !== color[j]) {
						return false;
					}
				}
				return true;
			},
			i,
			pixels,
			width = img.naturalWidth,
			length = Math.trunc(Math.min(width, height) / 6);

		canvas.width = width;
		canvas.height = height;
		context.drawImage(img, 0, 0);
		pixels = context.getImageData(0, 0, width, height).data;

		for (i = 0; i <= length; i++) {
			if (!isBackgroundPixel(i * (width + 1)) ||
				!isBackgroundPixel(i * (width - 1)) ||
				!isBackgroundPixel(i + (width * (height - i - 1))) ||
				!isBackgroundPixel(width * (height - i) - i - 1)) {

				return false;
			}
		}
		return true;
	};

	var isUseless = function(text) {
		if (_useless && _useless.length) {
			for (var i = 0; i < _useless.length; i++) {
				if (!_useless[i].test) {
					_useless[i] = new window.RegExp(_useless[i], "i");
				}
				if (_useless[i].test(text)) {
					return true;
				}
			}
		}
		return false;
	};

	var isUselessPost = function(postElement, blog, post) {
		var content = postElement.html ? postElement.html() : postElement,
			i,
			j;

		if (isUseless(content)) {
			return true;
		}
		if (postElement.html) {
			if (postElement.find("a.useless-link").length > 0) {
				return true;
			}
		}
		if (blog &&
			blog.data &&
			blog.data.useless &&
			blog.data.useless.length) {

			for (i = 0; i < blog.data.useless.length; i++) {
				if (!blog.data.useless[i].test) {
					blog.data.useless[i] = new window.RegExp(blog.data.useless[i], "i");
				}
				if (blog.data.useless[i].test(content)) {
					return true;
				}
			}
		}
		if (post &&
			post.tags &&
			post.tags.length &&
			blog &&
			blog.data &&
			blog.data.useless_tags &&
			blog.data.useless_tags.length) {

			for (i = 0; i < blog.data.useless_tags.length; i++) {
				if (!blog.data.useless_tags[i].test) {
					blog.data.useless_tags[i] = new window.RegExp(blog.data.useless_tags[i], "i");
				}
				for (j = 0; j < post.tags.length; j++) {
					if (blog.data.useless_tags[i].test(post.tags[j])) {
						return true;
					}
				}
			}
		}
		return false;
	};

	var keepAlive = function(on) {
		var go = false;

		if (on) {
			go = _keepAliveCount++ === 0;
		} else {
			go = --_keepAliveCount === 0;
		}
		if (go) {
			$("#keepAlive")
				.get(0)[(on) ? "play" : "pause"]();
			/* $.toast("keep-alive: {0}"
				.format((on) ? "on" : "off")); */
		}
	};

	var loadBlog = function(info, reload) {
		var pageIndex;

		if (!reload) {
			window.sessionStorage.removeItem("blogPage");
			window.sessionStorage.removeItem("blogTag");
			window.sessionStorage.removeItem("blogPostType");
		} else {
			pageIndex = parseInt(window.sessionStorage.getItem("blogPage"));
		}
		clearBlogPage(true);
		hideStatus();
		refreshBlogTitle(info);
		$(".blogNavigator").each(function(i, item) {
			$(item)
				.empty()
				.show()
				.append($(document.createElement("button"))
					.addClass("firstPage")
					.attr({
						"type": "button"
					})
					.button({
						"icons": {
							"primary": (pageIndex) ?
								"ui-icon-arrowthickstop-1-w" :
								"ui-icon-refresh"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							loadBlogPage(info, 0);
						}
					}))
				.append($(document.createElement("button"))
					.addClass("previousPage")
					.attr({
						"type": "button"
					})
					.button({
						"disabled": !pageIndex,
						"icons": {
							"primary": "ui-icon-arrowthick-1-w"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							loadBlogPage(info, Math.max(info.blog.page - 1, 0));
						}
					}))
				.append($(document.createElement("span"))
					.addClass("pageIndex")
					.append($(document.createElement("span"))
						.addClass("content")))
				.append($(document.createElement("button"))
					.addClass("nextPage")
					.attr({
						"type": "button"
					})
					.data({
						"original-icon": "ui-icon-arrowthick-1-e"
					})
					.button({
						"icons": {
							"primary": "ui-icon-arrowthick-1-e"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							loadBlogPage(info, info.blog.page + 1);
						}
					}))
				.append($(document.createElement("button"))
					.addClass("lastPage")
					.attr({
						"type": "button"
					})
					.button({
						"icons": {
							"primary": "ui-icon-arrowthickstop-1-e"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							loadBlogPage(info, Math.max(Math.ceil(getPostCount(info) / _options.postsPerPage), 1) - 1);
						}
					}));
		});

		window.sessionStorage.setItem("blogTitle", info.title);
		window.sessionStorage.setItem("blog", info.url);
		window.sessionStorage[(info.blog && info.blog.data && info.blog.data.login_required) ?
			"setItem" :
			"removeItem"]("blogLoginRequired", true);

		var pageIndex = parseInt(window.sessionStorage.getItem("blogPage"));

		if (isNaN(pageIndex)) {
			pageIndex = undefined;
		}
		loadBlogPage(info, pageIndex);
	};

	var loadBlogPage = function(info, pageIndex, setAsLastViewed) {
		var blog = info.blog,
			blogPages/* = Math.max(Math.ceil(getPostCount(info) / _options.postsPerPage), 1)*/,
			pageElement = $("#blogPage");

		pageIndex = Math.max(pageIndex || 0, 0);
		if (blogPages) {
			pageIndex = Math.min(pageIndex, blogPages - 1);
		}
		window.loader.value(false);
		return window.loading(function() {
			var newPosts = 0,
				postType = window.sessionStorage.getItem("blogPostType");

			if (!(postType && postType.length)) {
				postType = _options.postType;
			}
			return $.when(blog.getPosts(pageIndex, info, postType, _options.postsPerPage,
				window.sessionStorage.getItem("blogTag"))).then(function(posts) {

				var hasFilter = (!!window.sessionStorage.getItem("blogTag") &&
					!!window.sessionStorage.getItem("blogTag").length) ||
					(!!postType && !!postType.length);

				var lastUpdatedDate = getLastUpdatedDate(info.url, true),
					newPages,
					oldPosts = 0,
					postsElement,
					wasNewPost = false;

				blogPages = Math.max(Math.ceil(getPostCount(info) / _options.postsPerPage), 1);
				clearBlogPage(true);
				$(".blogNavigator")
					.find(".firstPage")
					.button("option", "icons", {
						"primary": (pageIndex) ?
							"ui-icon-arrowthickstop-1-w" :
							"ui-icon-refresh"
					});
				$(".blogNavigator")
					.find(".previousPage")
					.button((pageIndex) ?
						"enable" :
						"disable");
				return $.Deferred(function(deferred) {
					window.setTimeout(function() {
						var actualPosts = [ ],
							stickyPosts = [ ];

						$(posts).each(function(i, post) {
							((post.sticky) ? stickyPosts : actualPosts).push(post);
						});
						posts = actualPosts;
						pageElement
							.data({
								"posts": posts
							});
						$(posts).each(function(i, post) {
							var minutes,
								seconds;

							if (lastUpdatedDate.getTime() < post.timestamp.getTime()) {
								post.isNewPost = true;
								newPosts++;
							} else {
								oldPosts++;
							}
							if (post.type === "video") {
								if (post.duration) {
									minutes = (Math.floor((post.duration = Math.ceil(post.duration)) / 60)).toLocaleString();
									seconds = (post.duration % 60).toLocaleString();

									if (minutes.length < 2) {
										minutes = 0..toLocaleString() + minutes;
									}
									if (seconds.length < 2) {
										seconds = 0..toLocaleString() + seconds;
									}
									post.durationText = localizedFormat("duration",
										minutes, seconds);
								}
							}
						});
						if (oldPosts) {
							if (newPosts) {
								info.postsDifference = (pageIndex * _options.postsPerPage) + newPosts;
							}
						} else {
							info.postsDifference = getPostCount(info) - getLastViewedPosts(info.url, true);
						}
						if (info.postsDifference > 0) {
							if (newPosts && (pageIndex * _options.postsPerPage) + newPosts > info.postsDifference) {
								newPages = -(pageIndex + 1);
							} else {
								newPages = Math.ceil(info.postsDifference / _options.postsPerPage);
							}
						} else if (newPosts) {
							newPages = -(pageIndex + 1);
						}
						info.newPages = newPages;
						refreshBlogTitle(info, posts, newPosts, pageIndex);
						if (!(hasFilter || _options.peekMode || $.keyboard.isPressed("p"))) {
							if (isInMyBlogs(info)) {
								$.when(setLastViewedDate(info.title, info.url, (!pageIndex || !posts.length) ?
									info.updated : posts[0].timestamp, info.posts -
									(pageIndex * _options.postsPerPage), pageIndex, setAsLastViewed, info.is_nsfw, info.blog.data.login_required))
									.then(function() {

									refreshBlogList(info);
								});
							}
						}
						window.setTimeout(function() {
							var hasAnOldPost,
								waitFors = [];

							window.sessionStorage.setItem("blogPage", blog.page = pageIndex);
							$(".pageIndex").find(".newImage").remove();
							$(".pageIndex").find(".content").text((newPages && !hasFilter) ?
								localizedFormat("pageNumber2", pageIndex + 1, (newPages < 0) ?
									localizedFormat("lessThanZero", Math.abs(newPages)) :
									Math.abs(newPages), blogPages) :
								localizedFormat("pageNumber", pageIndex + 1, blogPages));
							if (newPosts > 0) {
								$(".pageIndex")
									.find(".content")
									.before(newImage(oldPosts > 0));
							}

							postsElement = $(document.createElement("div")).appendTo(pageElement);

							$(stickyPosts).each(function(i, post) {
								waitFors.push(loadPost(blog, postsElement, post, pageIndex, info.postsDifference, newPosts, posts.length, hasFilter));
							});
							$(posts).each(function(i, post) {
								if (!post.isNewPost) {
									hasAnOldPost = true;
									if (wasNewPost) {
										$(document.createElement("hr"))
											.appendTo(postsElement);
										$(document.createElement("hr"))
											.appendTo(postsElement);
									}
								}

								waitFors.push(loadPost(blog, postsElement, post, pageIndex, info.postsDifference, newPosts, posts.length, hasFilter));
								wasNewPost = post.isNewPost;
							});

							///
							$.when.apply(this, $(waitFors).filter(function(item) { return !!item; }).toArray()).always(function() {
							///

							$.when(applyBlogPageOptions()).then(function() {
								var buttons = $(".nextPage"),
									restoreButtons = function(icon) {
										buttons
											.removeClass("ui-state-highlight")
											.each(function(i, item) {
												$(item)
													.find(".ui-button-icon-primary")
													.removeClass("ui-icon-loader-16")
													.removeClass($(item).data("current-icon"))
													.addClass((icon && icon.length) ?
														icon :
														$(item).data("original-icon"));
												if (icon && icon.length) {
													$(item).data({
														"current-icon": icon
													});
												} else {
													$(item).removeData("current-icon");
												}
											});
									};

								window.setTimeout(scrollContentToTop);
								if (hasAnOldPost || !posts.length) {
									restoreButtons();
								} else if (info.postsDifference) {
									_nextPageCheckTimeout = window.setTimeout(function() {
										buttons.addClass("ui-state-highlight").each(function(i, item) {
											$(item)
												.find(".ui-button-icon-primary")
												.removeClass($(item).data("original-icon"))
												.removeClass($(item).data("current-icon"))
												.addClass("ui-icon-loader-16");
										});
										$.when(blog.getPosts((pageIndex + 1) * _options.postsPerPage, undefined,
											postType, 1, window.sessionStorage.getItem("blogTag")))
											.then(function(nextPost) {
												if (nextPost.length) {
													$(nextPost).each(function(i, item) {
														var hasANewPost = (!!$(posts)
															.filter(function(j, post) {
																return post.id === item.id;
															}).length || lastUpdatedDate.getTime() < item.timestamp.getTime());

														$.when(isFileDownloaded(item.download_url))
															.then(function(downloaded) {
																restoreButtons((hasANewPost) ?
																	"ui-icon-arrowthick-1-e-new" +
																		((item.type === "video" &&
																			item.download_url &&
																			item.download_url.length &&
																			!downloaded) ?
																			"-blue" :
																			String.empty) :
																	undefined);
															});
														if (!hasANewPost) {
															$(".newPostsSuffix").text(localizedFormat("newPostsSuffix",
																(pageIndex + 1) * _options.postsPerPage));
															$(".postIndex").each(function(j, indexItem) {
																indexItem = $(indexItem);

																indexItem.text(localizedFormat("two2",
																	indexItem.data("postIndex") + 1,
																	(pageIndex + 1) * _options.postsPerPage));
															});
															$(".pageIndex").find(".content").text(localizedFormat("three",
																pageIndex + 1, pageIndex + 1, blogPages));
														}
														return false;
													});
												} else {
													restoreButtons();
												}
											}, function() {
												restoreButtons();
											});
									}, DEFAULT_TIMEOUT * 5);
								}
								deferred.resolve();
							});

							///
							});
							///
						}, DEFAULT_TIMEOUT);
					}, DEFAULT_TIMEOUT);
				}).promise();
			}, function() {
				if (info.isLoginSupported && !blog.data.login_required) {
					blog.data.login_required = true;
					loadBlogPage(info, pageIndex, setAsLastViewed);
				}
			});
		}, localizedFormat("loadingPage", pageIndex + 1)).then(function() {
			/* pageElement.focus(); */
		});
	};

	var loadBlogs = function() {
		window.loader.cancelable(false);
		window.loader.value(false);
		return window.loading(function() {
			return $.afterTimeout(function() {
				var count = 0,
					downloadSychronization;

				return $.when((function() {
					var blogs,
						dataLength = 0,
						filter,
						infos = [ ],
						newBlogsCount = 0,
						now = $.now(),
						progress = 0,
						sessionInfos,
						t = createTumblr(),
						updateProgress = function() {
							window.loader.value(progress);
							window.loader.message(localizedFormat("loadingBlogsProgress",
								progress, blogs.length, formatFileSize(dataLength, {
									"maximumFractionDigits": 1,
									"minimumFractionDigits": 1
								})));
						};

					if (_dates) {
						if ((sessionInfos = window.sessionStorage.getItem("blogInfos")) && sessionInfos.length) {
							t = createTumblr();
							$(_infos = $.parseJSON(window.decodeURIComponent(sessionInfos))).each(function(i, info) {
								var blog;

								info.updated = new Date(info.updated);
								if (info.blogURL) {
									$(t.getBlog(info.blogURL)).eachProp(function(i, item) {
										if ($.isFunction(item)) {
											info.blog[i] = item;
										}
									});
									count++;
								}
							});
							if ($(".keepAlive").prop("autoplay")) {
								$(".keepAlive").get(0).pause();
							}
						} else {
							blogs = [ ];
							if ((filter = window.location.get(PARAMETERS.blogs)) !== undefined) {
								(function() {
									var a = [ ];

									filter = filter.split(/\W+/);
									for (var i = 0; i < filter.length; i++) {
										var j = parseInt(filter[i]);

										if (!isNaN(j)) {
											a.push(j);
										}
									}
									filter = (a.length) ? a : undefined;
								})();
							}

							$(_dates).eachProp(function(name, value) {
								var inFilter = !value.booooring,
									isBlogNSFW = value.force_nsfw || (value.was_nsfw && value.force_nsfw === undefined);

								if (inFilter && OFFICE_MODE !== 0) {
									switch (OFFICE_MODE) {
										case 1:
											inFilter = _options.nsfw || !isBlogNSFW;
											break;
										case 2:
											inFilter = !isBlogNSFW;
											break;
									}
								}
								if (inFilter) {
									inFilter = CHECK_ALL_BLOGS ||
										value.disabled === "auto" ||
										(!value.disabled && (!value.login_required || t.isLoginSupported));
								}

								if (inFilter && filter && filter.length) {
									inFilter = false;
									for (var j = 0; j < filter.length; j++) {
										if (filter[j] === i) {
											inFilter = true;
											break;
										}
									}
								}
								if (inFilter) {
									value = $.extend({ }, value);
									delete value.posts;
									blogs.push(t.getBlog(value));
								}
							});
							window.loader.value(0);
							window.loader.maximum(blogs.length);
							window.loader.message(localizedFormat("loadingBlogs", blogs.length));
							downloadSychronization = synchronizeDownloads();

							refreshSnapperButton();
							window.loader.cancelable(true);
							keepAlive(true);
							return $.when($.pool(POOL_SIZE, function(globalIndex, callerID) {
								if (!window.loader.isCanceled()) {
									return blogs[globalIndex];
								}
							}, function(blog, globalIndex, callerID) {
								return $.when(blog.getInfo(CHECK_ALL_BLOGS &&
									t.isLoginSupported &&
									blog.data.disabled &&
									!blog.data.login_required)).then(function(info) {

									var waitFor,
										checkMismatches,
										checkUselessPosts;

									dataLength += info.dataLength + 70;
									progress++;
									updateProgress();

									if (info.exists) {
										if (blog.data.disabled ||
											(blog.data.login_required && !t.isLoginSupported)) {

											$.toast.warning(localizedFormat("blogRecovered", info.title));
										}
										info.postsDifference = info.posts - getLastViewedPosts(info.url);
										info.nsfw = (info.force_nsfw !== undefined) ?
											info.force_nsfw : info.is_nsfw;
										if (getLastUpdatedDate(info.url).getTime() < info.updated.getTime()) {
											if (info.postsDifference <= 0 && _options.autoUpdatePostCountMismatches) {
												info.toAutoUpdate = true;
												checkMismatches = true;
											} else if (getBlogOptions(info.url).checkUselessPosts) {
												checkUselessPosts = true;
											} else {
												info.isNew = true;
											}
											if (checkMismatches || checkUselessPosts) {
												waitFor = $.when(blog.getPosts(undefined, info, undefined, (checkUselessPosts) ? _options.postsPerPage : 1))
													.then(function(posts) {
														var hasNonUselessNewPost = false;

														dataLength += posts.dataLength + 70;
														updateProgress();
														$(posts).each(function(i, post) {
															if (checkMismatches) {
																if (getLastUpdatedDate(info.url, true).getTime() < post.timestamp.getTime()) {
																	info.isNew = true;
																}
															} else if (checkUselessPosts) {
																if (getLastUpdatedDate(info.url, true).getTime() < post.timestamp.getTime() &&
																	!isUselessPost(post.body || post.caption || post.description || String.empty, blog, post)) {

																	hasNonUselessNewPost = true;
																	return false;
																}
															}
														});
														if (checkUselessPosts) {
															if (hasNonUselessNewPost) {
																info.isNew = true;
															} else {
																info.toAutoUpdate = true;
															}
														}
													});
											}
										} else {
											if ((now - info.updated.getTime()) > OLD_BLOG_INTERVAL) {
												info.isOld = true;
											}
											if (info.postsDifference && _options.autoUpdatePostCountMismatches) {
												info.toAutoUpdate = true;
											}
										}
										if (info.force_nsfw === info.is_nsfw && !info.no_warn_nsfw_force) {
											$.toast.warning(localizedFormat("blogRedundant", info.title));
										}
									} else {
										if (t.isLoginSupported) {
											info.isLoginSupported = true;
										}
										info.title = getLastViewedTitle(info.url) || info.title;
										if ((now - getLastUpdatedDate(info.url)) > OLD_BLOG_INTERVAL) {
											info.isOld = true;
										}
									}
									return $.when(waitFor).always(function() {
										if (info.isNew && (_options.nsfw || !info.nsfw)) {
											refreshSnapperButton(++newBlogsCount);
										}
										infos.push($.extend({ }, info, {
											"blog": blog
										}));
									});
								});
							})).then(function() {
								return $.Deferred(function(deferred) {
									window.setTimeout(function() {
										sortBlogs(infos);

										var alerts = [ ],
											notFound = [ ],
											newBlogs = [ ],
											oldBlogs = [ ],
											readBlogs = [ ];

										$(infos).each(function(i, info) {
											if (info.exists ||
												(info.blog.data &&
												info.blog.data.disabled === "auto")) {

												if (info.isOld) {
													oldBlogs.push(info);
												} else if (info.isNew) {
													newBlogs.push(info);
												} else {
													readBlogs.push(info);
												}
												count++;
											} else if (CHECK_ALL_BLOGS && info.blog.data && info.blog.data.disabled) {
												notFound.push(info);
											} else {
												info.isAlert = true;
												alerts.push(info);
											}
										});

										var newInfos = [ ];

										if (alerts.length) {
											newInfos.push({
												"class": "alertBlogsHeader",
												"itemClass": "alertBlog"
											});
											newInfos = newInfos.concat(alerts);
										}
										if (newBlogs.length) {
											newInfos.push({
												"class": "newBlogsHeader",
												"itemClass": "newBlog"
											});
											newInfos = newInfos.concat(newBlogs);
										}
										if (readBlogs.length) {
											newInfos.push({
												"class": "readBlogsHeader",
												"itemClass": "readBlog"
											});
											newInfos = newInfos.concat(readBlogs);
										}
										if (oldBlogs.length) {
											newInfos.push({
												"class": "oldBlogsHeader",
												"itemClass": "oldBlog"
											});
											newInfos = newInfos.concat(oldBlogs);
										}
										if (notFound.length) {
											newInfos.push({
												"class": "notFoundBlogsHeader",
												"itemClass": "notFound"
											});
											newInfos = newInfos.concat(notFound);
										}
										saveBlogs(_infos = newInfos);
										if (window.navigator.vibrate && _options.vibrateOnCheckCompletion) {
											window.navigator.vibrate(VIBRATIONS[(newBlogs.length) ?
												"NEW_BLOGS_FOUND" :
												"DEFAULT"]);
										}
										deferred.resolve();
									}, DEFAULT_TIMEOUT);
								}).promise();
							}).always(function() {
								window.loader.cancelable(false);
								keepAlive(false);
							});
						}
					}
				})()).then(function() {
					window.loader.value(false);
					window.loader.message(localizedFormat("loadingBlogs", count));
					return $.afterTimeout(function() {
						var autoUpdated = 0,
							blogsElement = $("#blogs"),
							now = $.now(),
							sorts;

						clearBlogPage();
						blogsElement.parent().scrollTop(0);
						blogsElement.empty();
						$(_infos).each(function(i, info) {
							if (info.url && info.url.length) {
								var blogDate,
									blogPosts,
									blogTitleElement,
									lastViewedDate = getLastViewedDate(info.url),
									postsDifference,
									redundants = [ ],
									seenDate,
									seenPosts,
									textElement,
									title = info.url,
									update;

								var blogElement = $(document.createElement("div"))
									.addClass("ui-widget-content")
									.addClass("blog")
									.data({
										"info": info
									})
									.appendTo(blogsElement);

								if (info.disabled) {
									blogElement.addClass("disabledBlog");
								}

								if (info.exists) {
									postsDifference = info.postsDifference;

									if (info.nsfw) {
										blogElement.addClass("nsfwBlog");
									}
									if (info.isNew) {
										blogElement.addClass("newBlog");
									} else if (info.isOld) {
										blogElement.addClass("oldBlog");
									} else {
										blogElement.addClass("readBlog");
									}
									$(document.createElement("img"))
										.addClass("avatar")
										.appendTo(blogElement);
								} else if (info.isOld) {
									blogElement.addClass("oldBlog");
								}

								blogTitleElement = $(document.createElement("span"))
									.addClass("blogTitle")
									.appendTo(blogElement);

								if (info.exists) {
									newImage()
										.addClass("newBlog")
										.hide()
										.appendTo(blogTitleElement);
									$(document.createTextNode(info.title))
										.appendTo(blogTitleElement);
								} else {
									blogTitleElement = blogElement
										.addClass("notFound")
										.addClass((info.isAlert) ? "alert" : undefined)
										.addClass("ui-state-error")
										.append($(document.createElement("a"))
											.attr({
												"href": window.location.sameProtocol(info.url),
												"target": "_blank",
												"title": window.location.sameProtocol(info.url)
											})
											.text((info.title && (info.title !== info.name)) ?
												localizedFormat("two3", info.title, info.url) :
												info.url));
								}

								blogTitleElement.append(textElement = $(document.createElement("div"))
									.addClass("dateInfo"));
								blogPosts = (info.exists) ?
									info.posts :
									getLastViewedPosts(info.url);

								textElement.append($(document.createTextNode(getLocalizedText("posts") +
									blogPosts.toLocaleString())));
								textElement.append($(document.createElement("br")));

								if (info.exists && (postsDifference || info.isNew)) {
									blogElement.data({
										"postsDifference": postsDifference
									});
									textElement.append($(document.createTextNode(getLocalizedText("newPosts"))));
									textElement.append($(document.createElement("span"))
										.text((postsDifference <= 0 && info.posts > 0) ?
											localizedFormat("lessThanZero", postsDifference) :
											postsDifference.toLocaleString()));
									textElement.append($(document.createElement("br")));
								}
								if (info.exists && !info.isNew && info.toAutoUpdate) {
									/* $.toast.message(localizedFormat("autoUpdatingPostCountMismatches", info.title)); */
									setLastViewedDate(info.title, info.url, info.updated, info.posts, 0, true, info.is_nsfw, undefined, true);
									autoUpdated++;
								}

								blogDate = (info.exists) ?
									info.updated :
									getLastUpdatedDate(info.url);

								if (blogDate && blogDate.getTime && !isNaN(blogDate.getTime())) {
									textElement.append($(document.createTextNode(localizedFormat("updated", blogDate))));
									title += "\n" + localizedFormat("updated", getDateIntervalFromNow(now - blogDate.getTime()));
								}
								if (lastViewedDate.getTime() > 0) {
									textElement
										.append($(document.createElement("br")))
										.append($(document.createTextNode(localizedFormat("viewed",
											lastViewedDate))));
									title += "\n" + localizedFormat("viewed", getDateIntervalFromNow(now - lastViewedDate.getTime()));

									seenDate = getLastSeenDate(info.url);

									if (seenDate && seenDate.getTime && !isNaN(seenDate.getTime()) &&
										seenDate.getTime() && seenDate.getTime() !== lastViewedDate.getTime()) {

										textElement
											.append($(document.createElement("br")))
											.append($(document.createTextNode(localizedFormat("seen", seenDate))));
										title += "\n" + localizedFormat("seen", getDateIntervalFromNow(now - seenDate.getTime()));

										seenPosts = getLastSeenPosts(info.url);
										if (seenPosts && seenPosts !== info.posts) {
											textElement
												.append($(document.createElement("br")))
												.append($(document.createTextNode(localizedFormat("seenPosts", seenPosts))));
										}
									}
								}
								if (info.force_nsfw !== undefined || info.is_nsfw) {
									blogTitleElement
										.append($(document.createElement("img"))
										.attr({
											"src": "images/{0}.png".format((info.force_nsfw !== undefined) ?
												(info.force_nsfw === info.is_nsfw) ?
													(info.is_nsfw) ?
														"nsfw_forced_redundant" :
														"nsfw_sfw_forced_redundant" :
													(info.force_nsfw) ?
														"nsfw_forced" :
														"nsfw_sfw_forced" :
												(info.is_nsfw) ?
													"nsfw" :
													undefined)
										}));
								}
								blogElement.on({
									"click": function(e) {
										if ($(e.target).closest("a").length) {
											e.preventDefault();
										}
										$(document.body).data("snapper").close();
										loadBlog(info);
									}
								});
								blogElement.attr({
									"title": title
								});
							} else {
								$(document.createElement("div"))
									.addClass("ui-widget-header")
									.addClass(info["class"])
									.data({
										"info": info
									})
									.append($(document.createElement("div"))
										.addClass("text"))
									.appendTo(blogsElement);
							}
						});

						(function() {
							sorts = [ ];
							for (var i in _textTable.sort) {
								sorts.push({ "by": i, "ascending": true});
								sorts.push({ "by": i });
							}
						})();

						blogsElement
							.find(".ui-widget-header")
							.off()
							.on({
								"click": function(e) {
									return e.preventAll();
								}
							})
							.each(function(i, item) {
								(item = $(item)).append(createPopoverButton({
									"className": "noSnapperOnClick",
									"icon": "ui-icon-carat-2-n-s",
									"items": $.map(sorts, function(sortItem) {
										return {
											"click": function(e) {
												var targetItem = $(e.target).closest(".popoverInnerButton"),
													headerItem = targetItem.data("item"),
													info = headerItem.data("info"),
													elements = $.makeArray($("#blogs").find(".blog." + info.itemClass)),
													lastElement,
													sortInfo = targetItem.data("sortItem");

												elements.sort(function(a, b) {
													var r = 0,
														x = 0,
														y = 0;

													a = $(a).data("info");
													b = $(b).data("info");

													try {
														switch (sortInfo.by) {
															case "posts":
																x = a.posts || 0;
																y = b.posts || 0;
																break;
															case "updated":
																x = getLastUpdatedDate(a.url).getTime();
																y = getLastUpdatedDate(b.url).getTime();
																break;
															case "viewed":
																x = getLastViewedDate(a.url).getTime();
																y = getLastViewedDate(b.url).getTime();
																break;
														}
													} catch (e) { }
													if (!r) {
														if (x !== y) {
															r = (x < y) ? -1 : 1;
														}
													}
													if (!r) {
														a = (a.title || a.name).toLowerCase();
														b = (b.title || b.name).toLowerCase();

														r = (a < b) ? -1 : (a > b) ? 1 : 0;
													}
													return r;
												});
												if (!sortInfo.ascending) {
													elements.reverse();
												}

												lastElement = headerItem;
												$(elements).each(function(i, element) {
													lastElement.after(element);
													lastElement = element;
												});
												targetItem
													.parent()
													.find(".popoverInnerButton")
													.removeClass("ui-state-focus")
													.end()
													.end()
													.addClass("ui-state-focus");
											},
											"data": {
												"item": item,
												"sortItem": sortItem
											},
											"icon": "ui-icon-circle-triangle-" + ((sortItem.ascending) ? "n" : "s"),
											"keepOpen": true,
											"text": localizedFormat("two5", getLocalizedText("sort." + sortItem.by),
												getLocalizedText((sortItem.ascending) ? "ascending" : "descending"))
										};
									}),
									"popTitle": getLocalizedText("sortBy"),
									"text": true
								}));
							});
						if (downloadSychronization &&
							downloadSychronization.state() === "pending") {

							window.loader.message(getLocalizedText("waitingForDownloads"));
						}
						return $.when(downloadSychronization).always(function() {
							applyBlogsOptions(!!window.sessionStorage.getItem("blog"));
							if (autoUpdated > 0) {
								$.toast.message(localizedFormat("autoUpdatedBlogs", autoUpdated));
							}
							refreshReadLaterButton();
							loadLastBlog();
						});
					});
				});
			});
		}, getLocalizedText("loading"));
	};

	var loadImageEntry = function(entry, host) {
		host.loading++;
		entry.loading = true;
		entry.started = $.now();
		entry.image.data({
			"hostName": host.name,
			"queueKey": entry.key
		}).attr({
			"src": entry.src,
		});

		/* window.console.info("Host [{0}], ({1}, {2}): {3} ({4}) - started on {5}{6}"
			.format(host.name, host.count, host.loading,
				entry.key, entry.src.split("/").pop(), new Date(entry.started).toLocaleString(), (entry.deferred) ?
					" (deferred for {0})".format(getDateInterval(entry.started - entry.enqueued)) :
					String.empty)); */
	};

	var loadLastBlog = function() {
		var blog = window.sessionStorage.getItem("blog"),
			found,
			newBlog;

		if (blog && blog.length) {
			$(_infos).each(function(i, info) {
				var selectedItem;

				if (info.url === blog) {
					loadBlog(info, true);
					if ((selectedItem = $("#blogs").parent().find(".ui-state-focus")).length) {
						scrollToBlog(selectedItem);
					}
					found = true;
					return false;
				}
			});
			if (!found) {
				var newBlog = createTumblr().getBlog(window.location.noProtocol(blog).split("/")[0]);

				if (window.sessionStorage.getItem("blogLoginRequired")) {
					newBlog.data = {
						"login_required": true
					};
				}
				$.when(newBlog.getInfo()).then(function(info) {
					if (info.exists) {
						info.blog = newBlog;
						loadBlog(info, true);
					}
				});
			}
		}
	};

	var loadLocalizedTexts = function() {
		var i,
			language = window.location.get(PARAMETERS.language);

		if (language && language.length) {
			_textTable = textTables[language];
		}
		if (!_textTable) {
			for (i in textTables) {
				_textTable = textTables[language = i];
				/* break; */
			}
		}

		$(_usageModes).each(function(i, item) {
			var name,
				mode;

			for (name in item) {
				mode = item[name];
				if (name[0] !== "_" && typeof mode === "string") {
					item[name] = getLocalizedText("usageModes")[mode] ||
						getLocalizedText(mode);
				}
			}
		});

		$(".localizedText").each(function(i, item) {
			var element = $(item);

			element.html(replaceHTMLNewLines(getLocalizedText(element.data("localizedtext"))));
		});
	};

	var loadNonPreloadedImages = function() {
		var allImages,
			newOnly,
			offsetParent = getBlogPageScroller(),
			parentHeight = offsetParent.height() + offsetParent.offset().top,
			waitFors = [ ],
			visibleImages = [ ];

		allImages = $("#blogPage")
			/* .find("iframe, img, video, source") */
			.find("[has-src]")
			.filter(function(i, image) {
				var postElement = (image = $(image))
					.closest(".blogPost");

				if (postElement.length &&
					postElement.hasClass("collapsed")) {

					return false;
				}
				return image.data("src") &&
					!image.attr("src") &&
					!image.hasClass("loading");
			});
		newOnly = !!allImages.filter(function(i, image) {
			return !!($(image).closest(".stickyPost").length +
				$(image).closest(".newPost").length +
				$(image).closest(".firstNonNewPost").length);
		}).length;
		allImages.each(function(i, image) {
			if (getMediaTargetElement(image).offset().top <= parentHeight) {
				if (!$.keyboard.isPressed("q")) {
					visibleImages.push(image);
				}
			}
		});
		if (visibleImages.length && getPreloadImages(window.sessionStorage.getItem("blog"))) {
			visibleImages = allImages;
		}
		$(visibleImages).each(function(i, image) {
			image = $(image);
			if (!(newOnly && !(image.closest(".stickyPost").length +
				image.closest(".newPost").length +
				image.closest(".firstNonNewPost").length))) {

				if (newOnly) {
					waitFors.push(bindMediaLoading(image, true));
				}
				if (image.hasClass("micro") &&
					!image.closest(".photo").length &&
					!image.closest(".photo-2").length) {

					image.on({
						"click": function(e) {
							$(this).toggleClass("micro");
						}
					});
				}
				startLoadingImage(image);
			}
		});
		if (waitFors.length) {
			$.when.apply(this, waitFors).always(function() {
				loadNonPreloadedImages();
			});
		}
	};

	var loadOptions = function() {
		var localOptions = window.localStorage.getItem(STORAGE_NAME);

		if (localOptions && localOptions.length) {
			localOptions = $.parseJSON(window.decodeURIComponent(localOptions));

			for (var name in _options) {
				var value = localOptions[name];

				if (value !== undefined && value !== null) {
					_options[name] = value;
				}
			}
		}
		parseParameters();
		loadTheme();

		loadThemes();

		var avatarSizeElement = $("#options_avatarSize").empty();

		$(tumblr.AVATAR_SIZES).each(function(i, size) {
			avatarSizeElement.append($(document.createElement("option"))
				.text(localizedFormat("size", size, size))
				.val(i));
		});
		avatarSizeElement.selectmenu({
			"appendTo": $(".optionsDialog"),
			"open": function(e, ui) {
				$(".ui-selectmenu-open").css("z-index",
					avatarSizeElement.closest(".ui-dialog").css("z-index") + 1);
			}
		});

		var postTypeElement = $("#options_postType").empty();

		$(tumblr.POST_TYPES).each(function(i, type) {
			postTypeElement.append($(document.createElement("option"))
				.text(_textTable["postTypes"][type.value])
				.val(type.value));
		});
		postTypeElement.selectmenu({
			"appendTo": $(".optionsDialog"),
			"open": function(e, ui) {
				$(".ui-selectmenu-open").css("z-index",
					postTypeElement.closest(".ui-dialog").css("z-index") + 1);
			}
		});

		var postsPerPageElement = $("#options_postsPerPage").empty();

		for (var i = 0; i <= tumblr.MAX_POSTS_PER_PAGE; i+= POSTS_PER_PAGE_STEP) {
			if (i) {
				postsPerPageElement.append($(document.createElement("option"))
					.text(i)
					.val(i));
			}
		}
		postsPerPageElement.selectmenu({
			"appendTo": $(".optionsDialog"),
			"open": function(e, ui) {
				$(".ui-selectmenu-open").css("z-index",
					postsPerPageElement.closest(".ui-dialog").css("z-index") + 1);
			}
		});

		$("#options_nativeDownload").prop("disabled", !XMLHTTPDOWNLOAD);

		var usageModeDialogElement = $(".usageModeDialog");

		$(_usageModes).each(function(i, mode) {
			/* if (i > 0 && i % 2 === 0) {
				usageModeDialogElement.append($(document.createElement("br")));
			} */
			usageModeDialogElement
				.append($(document.createElement("button"))
					.attr({
						"title": mode.name,
						"type": "button"
					})
					.data({
						"mode": mode
					})
					.on({
						"click": function(e) {
							var modeOptions = $(e.target)
								.closest(".ui-button")
								.data("mode")
								.options,
								options;

							if (modeOptions) {
								options = usageModeDialogElement.data("options");
								for (var name in modeOptions) {
									options[name] = modeOptions[name];
								}
							}
							usageModeDialogElement.dialog("close");
						}
					})
					.button()
					.append($(document.createElement("img"))
						.attr({
							"src": String.format("images/modes/{0}.png", mode["_icon"])
						})));
		});

		$(".pageOptionsDialog")
			.find(".searchTag")
				.button({
					"icons": {
						"primary": "ui-icon-search"
					},
					"text": false
				})
			.end()
			.find(".resetTag")
				.button({
					"icons": {
						"primary": "ui-icon-closethick"
					},
					"text": false
				});
	};

	var loadPage = function() {
		var preloadingTimeout;

		var checkNonPreloadedImages = function() {
			if (preloadingTimeout) {
				window.clearTimeout(preloadingTimeout);
			}
			preloadingTimeout = window.setTimeout(loadNonPreloadedImages,
				PRELOAD_TIMEOUT);
		};

		var resizePageContent = function() {
			if ($("#content").css("overflow") === "visible") {
				$("#blogPageContainer").css({
					"height": $("#content").height() -
						$(".header").outerHeight()
				});
			}
			checkNonPreloadedImages();
		};

		loadLocalizedTexts();

		var documentTitle = window.location.get(PARAMETERS.title);

		document.title = (documentTitle && documentTitle.length) ?
			unescape(documentTitle) :
			getLocalizedText("pageTitle");

		var favicon = window.location.get(PARAMETERS.favicon);

		if (favicon && favicon.length) {
			$("#favicon").add($("#shortcutIcon")).attr({
				"href": window.decodeURIComponent(favicon)
			});
		}
		$("#favicon").add($("#shortcutIcon")).data({
			"icon": $("#favicon").attr("href")
		});

		$(".header")
			.find(".loader")
			.button({
				"icons": {
					"primary": "ui-icon-loader-16"
				},
				"text": false
			});
		$(".optionsDialog").attr({
			"title": getLocalizedText("options")
		}).find(".version").text((function() {
			var currentScripts = window.document.getElementsByTagName("script"),
				date,
				source;

			if (currentScripts.length) {
				source = currentScripts[currentScripts.length - 1].getAttribute("src").split("?");

				if (source.length > 1) {
					source = window.parseArguments(source[1]).v;
					if (source && source.length) {
						date = new Date("{0}-{1}-{2}".format(source.substr(0, 4), source.substr(4, 2), source.substr(6, 2)));

						return localizedFormat("version", (!isNaN(date.getTime())) ?
							date.toLocaleDateString ? date.toLocaleDateString() : date.toLocaleString() :
							source);
					}
				}
			}
		})());

		$(".title")
			.find("a")
			.on({
				"click touchstart": function(e) {
					reloadPage();
					return e.preventAll();
				}
			});

		$(window).on({
			"resize": resizePageContent
		});
		resizePageContent();

		window.loader.cancelButtonText(getLocalizedText("cancel"));
		window.navigator.vibrate =
			window.navigator.vibrate ||
			window.navigator.webkitVibrate ||
			window.navigator.mozVibrate ||
			window.navigator.msVibrate;

		$.when(true/*_downloads.load()*/).then(function() {
			var readLater = window.localStorage.getItem(STORAGE_NAME_READLATER),
				useless = window.localStorage.getItem(STORAGE_NAME_USELESS);

			if (readLater && readLater.length) {
				try {
					_readLater = $.parseJSON(readLater);
				} catch (e) { }
			}
			if (useless && useless.length) {
				try {
					_useless = $.parseJSON(useless);
				} catch (e) { }
			}
			$.when(loadOptions()).then(function() {
				$(".snapper")
					.button({
						"icons": {
							"primary": "ui-icon-grip-solid-horizontal"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							$(document.body)
								.data("snapper")
								.open("left");
							return e.preventAll();
						}
					});
				$($.keyboard).on({
					"keydown.keyboard": function(e) {
						if (!isADialogOpen()) {
							if ($(".fullScreenContainer").is(":visible")) {
								switch (e.which) {
									case 27:	// Escape
										$(".fullScreen").trigger("click");
										break;
									case 33:	// Page Up
										previousSlide(true);
										break;
									case 34:	// Page Down
										nextSlide(true);
										break;
									case 37:	// Left
										previousSlide();
										break;
									case 39:	// Right
										nextSlide();
										break;
									default:
										/* $.toast.message(e.which); */
										break;
								}
							} else {
								switch (e.which) {
									case 113:	// F2
										if (window.sessionStorage.getItem("blog")) {
											$(".blogNavigator")
												.first()
												.find(".previousPage")
												.first()
												.trigger("click");
										}
										break;
									case 115:	// F4
										if (window.sessionStorage.getItem("blog")) {
											$(".blogNavigator")
												.first()
												.find(".nextPage")
												.first()
												.trigger("click");
										}
										break;
									case 116:	// F5
										if (e.altKey) {
											$(".header .title .tumblr").trigger("click");
										}
										break;
									case 120:	// F9
										$(document.body)
											.data("snapper")
											[($(document.body).hasClass("snapjs-left")) ?
												"close" : "open"]("left");
										break;
									default:
										/* $.toast.message(e.which); */
										break;
								}
							}
						}
					}
				});

				var snapper,
					width = Math.floor(Math.max($(window).width() * 0.4, 265));

				$(".snap-drawer").css({
					"width": width
				});
				$(document.body).data({
					"snapper": snapper = new Snap({
						"addBodyClasses": true,
						"disable": "right",
						"element": document.getElementById("content"),
						"hyperextensible": false,
						"maxPosition": width + 1,
						"touchToDrag": true
					})
				});
				snapper.on({
					"animated": function() {
						if ($(document.body).hasClass("snapjs-left")) {
							$(".statusToast").addClass("noSnapperOnClick");
							resizePageContent();
							/* $(".snap-drawer-left").focus(); */
						} else {
							/* $("#blogPage").focus(); */
						}
					}
				});
				setTimeout(function() {
					$("#blogs")
						.append($(document.createElement("div"))
							.addClass("noBlog")
							.addClass("ui-state-highlight")
							.addClass("ui-corner-all")
							.text(getLocalizedText("noBlog")));
				}, 1e3);

				$(".popover")
					.button({
						"icons": {
							"primary": "ui-icon-triangle-1-s"
						},
						"text": false
					})
					.webuiPopover({
						"animation": "fade",
						"onShow": function(target) {
							target
								.addClass("ui-widget-content")
								.css({
									"background-color": $("#content").css("background-color")
								});
						},
						"style": "mainPopoverContent"
					});

				$(".downloads")
					.button({
						"icons": {
							"primary": "ui-icon-arrowthickstop-1-s"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							e.preventDefault();
							$(".popover").webuiPopover("hide");
							showDownloads();
						}
					});
				openDialog($(".downloadsProgressDialog").attr({
					"title": localizedFormat("activeDownloads", _downloadManager.count())
				}), {
					"autoOpen": false,
					"buttons": [{
						"click": function(e) {
							$(this).dialog("close");
						},
						"text": getLocalizedText("ok")
					}],
					"create": function() {
						$(this).css("maxWidth", $(window).width() * 0.85);
					},
					"dialogClass": "centerButtons",
					"maxHeight": $(window).height() * 0.9,
					"minHeight": $(window).height() * 0.65,
					"minWidth": $(window).width() * 0.5,
					"position": {
						"my": "top",
						"at": "top+{0}".format(Math.ceil($(window).height() * 0.05))
					}
				});

				$(".login")
					.button({
						"icons": {
							"primary": "ui-icon-key"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							$(".popover").webuiPopover("hide");
							reconnect(true);
						}
					});

				$(".menu")
					.button({
						"icons": {
							"primary": "ui-icon-gear"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							$(".popover").webuiPopover("hide");
							showOptions();
						}
					});

				$(".usageModes")
					.button({
						"icons": {
							"primary": "ui-icon-heart"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							$(".popover").webuiPopover("hide");
							$.when(showUsageModeDialog($.extend({ }, _options)))
								.then(function(options) {
									applyOptions(options);
									loadTheme();
								});
						}
					});
				$(".filters")
					.button({
						"icons": {
							"primary": "ui-icon-lightbulb"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							$(".popover").webuiPopover("hide");
							openDialog($(".filtersDialog"), {
								"dialogClass": "no-title",
								"position": {
									"my": "left top",
									"at": "left+{0} top+{1}"
										.format($(window).width() * 0.05,
											$(window).height() * 0.05)
								},
								"width": "auto"
							});
						}
					});
				$(".downloader")
					.button({
						"icons": {
							"primary": "ui-icon-arrowthickstop-1-s",
							"secondary": "ui-icon-search"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							$(".popover").webuiPopover("hide");
							showDownloadsInPage(true);
						}
					});
				$(".readLater")
					.button({
						"icons": {
							"primary": "ui-icon-clock"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							$(".popover").webuiPopover("hide");
							showReadLater();
						}
					});

				var applyFilters = function() {
					if (!$(".filtersDialog").data("filtersLock")) {
						var filter = [ ];

						$(".filtersDialog")
							.find("input[type=range]")
							.filter(function(i, item) {
								return (item = $(item)).val() !== item.data("reset");
							})
							.each(function(i, item) {
								filter.push("{0}({1})"
									.format((item = $(item)).data("filter"),
									(item.data("format") || "{0}")
										.format(item.val())));
							});

						$("#cssFilters").remove();
						if (filter.length) {
							var e = $(document.createElement("a"))
								.vendorSpecificCss("filter", filter.join(" "));

							$(document.createElement("style"))
								.attr({
									"id": "cssFilters",
									"type": "text/css"
								})
								.text("{0} {{1}}".format([
									"#blogPage .postContent img",
									"#blogPage .postContent video",
									".fullScreenImageContainer"
								].join(", "), e.attr("style")))
								.appendTo($("head"));

						}
						/* $(document.body).vendorSpecificCss("filter", filter.join(" ")); */
					}
				};

				if (!$(document.createElement("div"))
					.css("-webkit-filter", "brightness(101%)")
					.css("-webkit-filter").length) {

					$(".filtersDialog")
						.find("input[type=range]")
						.each(function(i, item) {
							var resetValue;

							if ((item = $(item)).data("filter") === "brightness") {
								resetValue = parseFloat(item.data("reset"));

								item.attr("min", parseFloat(item.attr("min")) - resetValue);
								item.attr("max", parseFloat(item.attr("max")) - resetValue);
								item.data("reset", 0);
							}
						});
				}

				$(".filtersDialog")
					.find(".resetButton")
						.button()
						.on({
							"click": function(e) {
								$(".filtersDialog")
									.data({
										"filterLock": true
									})
									.find("input[type=range]")
									.each(function(i, item) {
										(item = $(item)).val(parseInt(item.data("reset")));
									})
									.end()
									.removeData("filterLock");
								applyFilters();
							}
						})
						.trigger("click")
					.end()
					.find("input[type=range]")
						.on({
							"input": applyFilters
						});

				$(".pageOptionsDialog")
					.find(".archive")
						.on({
							"click": function(e) {
								showLink($(this).attr("href"));
							}
						})
						.button({
							"icons": {
								"primary": "ui-icon-suitcase"
							}
						})
					.end()
					.find(".refreshPage")
						.button({
							"icons": {
								"primary": "ui-icon-refresh"
							}
						})
						.on({
							"click": function(e) {
								var info = $(".pageOptionsDialog").data("info");

								$(".pageOptionsDialog").dialog("close");
								loadBlogPage(info, info.blog.page);
							}
						})
					.end()
					.find(".blogStatistics")
						.button({
							"icons": {
								"primary": "ui-icon-info"
							}
						})
						.on({
							"click": function(e) {
								showBlogStatistics($(".pageOptionsDialog").data("info"), true, true);
							}
						})
					.end()
					.find(".viewDownloads")
						.button({
							"icons": {
								"primary": "ui-icon-arrowthickstop-1-s"
							}
						})
						.on({
							"click": function(e) {
								showDownloadsInPage();
							}
						});

				(function() {
					var statisticsDialog = $(".blogStatisticsDialog"),
						statisticsTable = statisticsDialog.find(".blogStatisticsTable"),
						postsPerTypeRow = statisticsTable.find(".postsPerType"),
						insertAfter = postsPerTypeRow.prev(),
						postTypes = $(tumblr.POST_TYPES).map(function(i, type) {
							return $.extend({ }, type, {
								"name": _textTable.postTypes[type.value]
							});
						}).get();

					postsPerTypeRow.remove();
					postTypes.sortBy("name")
					$(postTypes).each(function(i, type) {
						var newRow;

						if (type.value && type.value.length) {
							insertAfter.after(newRow = postsPerTypeRow
								.clone()
								.find(".postType")
									.append($(document.createElement("ul"))
										.append($(document.createElement("li"))
											.append($(document.createElement("a"))
												.append($(document.createElement("div"))
													.addClass("postTypeLabel")
													.append(getPostTypeImage({
														"type": type.value
													}))
													.append($(document.createElement("span"))
														.addClass("postTypeName")
														.text(type.name)))
												.attr({
													"href": "#"
												})
												.on({
													"click": function(e) {
														window.sessionStorage.setItem("blogPostType", type.value);
														window.sessionStorage.removeItem("blogPage");
														$(".pageOptionsDialog").dialog("close");
														$(".blogStatisticsDialog").dialog("close");
														window.setTimeout(loadLastBlog);
														return e.preventAll();
													}
												}))))
									.end()
								.find(".postCount")
									.data({
										"postType": type.value
									})
									.end());
							insertAfter = newRow;
						}
					});
					statisticsTable
						.find(".value")
						.append($(document.createElement("span"))
							.addClass("ui-icon")
							.addClass("ui-icon-loader-16"))
						.append($(document.createElement("span"))
							.addClass("field"));

				})();
				$(".downloadsDialog")
					.add($(".downloaderDialog"))
					.attr({
						"title": getLocalizedText("downloads")
					})
					.find(".nextDownloads")
					.button();

				$(".pageOptionsDialog")
					.find(".searchTag")
						.button()
					.end()
					.find(".tagToSearch")
						.closest("form")
						.on({
							"submit": function(e) {
								var tag = $(".pageOptionsDialog")
									.find(".tagToSearch")
									.val();

								$(".pageOptionsDialog").dialog("close");
								if (!(tag && tag.length)) {
									tag = undefined;
								}
								searchTag(tag);
								return e.preventAll();
							}
						});
				$(".pageOptionsDialog")
					.find(".resetTag")
						.on({
							"click": function(e) {
								$(".pageOptionsDialog")
									.find(".tagToSearch")
									.val(String.empty);
							}
						})
					.end()
					.find(".goToPage")
						.button({
							"icons": {
								"primary": "ui-icon-arrowthick-1-e"
							},
							"text": false
						})
						.closest("form")
							.on({
								"submit": function(e) {
									var pageNumber = parseInt($(".pageOptionsDialog")
										.find(".pageNumber")
										.val());

									if (!isNaN(pageNumber) && pageNumber) {
										loadBlogPage($(".pageOptionsDialog").data("info"), pageNumber - 1);
										$(".pageOptionsDialog").dialog("close");
									}
									return e.preventAll();
								}
							});

				$.keyboard.numericInput($(".pageOptionsDialog")
					.find(".pageNumber"));

				$(".pageOptionsDialog")
					.find(".goToLastViewedPage")
						.on({
							"click": function(e) {
								var info = $(".pageOptionsDialog").data("info"),
									lastUpdatedDate = getLastUpdatedDate(info.url, true),
									newPages = parseInt(info.newPages),
									postType = window.sessionStorage.getItem("blogPostType");

								if (isNaN(newPages) || newPages < 0) {
									newPages = parseInt(window.sessionStorage.getItem("blogPage"));
								} else if (newPages) {
									newPages--;
								}
								if (!(postType && postType.length)) {
									postType = _options.postType;
								}
								window.loading(function() {
									return $.Deferred(function(deferred) {
										var forward = true,
											pageFound = function(pageIndex) {
												$.when(loadBlogPage(info, pageIndex, true)).then(function() {
													$(".pageOptionsDialog").dialog("close");
													deferred.resolve();
												});
											},
											scanPage = function(pageIndex) {
												return $.Deferred(function(pageDeferred) {
													window.loader.message(localizedFormat("searchingInPage", pageIndex + 1));
													$.when(info.blog.getPosts(pageIndex, undefined, postType, _options.postsPerPage,
														window.sessionStorage.getItem("blogTag"))).then(function(posts) {

														var hasANewPost = false,
															hasAnOldPost = false;

														$(posts).each(function(i, post) {
															if (!post.sticky) {
																if (post.timestamp.getTime() > lastUpdatedDate.getTime()) {
																	hasANewPost = true;
																} else {
																	hasAnOldPost = true;
																}
																if (hasANewPost && hasAnOldPost) {
																	return false;
																}
															}
														});
														pageDeferred.resolve({
															hasANewPost: hasANewPost,
															hasAnOldPost: hasAnOldPost,
															length: posts.length,
															pageIndex: pageIndex
														});
													});
												}).promise();
											},
											scanPages = function(index) {
												$.when(scanPage(index)).then(function(scanResult) {
													if (scanResult.length < _options.postsPerPage ||
														(scanResult.hasANewPost && scanResult.hasAnOldPost)) {
														pageFound(scanResult.pageIndex);
													} else if (scanResult.hasANewPost) {
														if (forward) {
															scanPages(index + 1);
														} else {
															pageFound(scanResult.pageIndex);
														}
													} else if (scanResult.pageIndex > newPages) {
														pageFound(scanResult.pageIndex - 1);
													} else {
														forward = false;
														scanPages(index - 1);
													}
												});
											};

										window.setTimeout(function() {
											scanPages(newPages);
										}, DEFAULT_TIMEOUT);
									}).promise();
								}, localizedFormat("searching"));
							}
						})
						.button({
							"icons": {
								"primary": "ui-icon-seek-next"
							}
						})
					.end()
					.find(".goToBlog")
						.on({
							"click": function(e) {
								$(".pageOptionsDialog").dialog("close");
							}
						})
					.end()
					.find(".resetPostType")
						.on({
							"click": function(e) {
								window.sessionStorage.removeItem("blogPostType");
								window.sessionStorage.removeItem("blogPage");
								$(".pageOptionsDialog").dialog("close");
								window.setTimeout(loadLastBlog);
							}
						})
						.button({
							"icons": {
								"primary": "ui-icon-refresh"
							}
						})
					.end()
					.find(".enableBlog")
						.on({
							"click": function(e) {
								var data = $(this).data();

								$.when($.confirm(localizedFormat("confirmEnableBlog", data.title), undefined, [
									getLocalizedText("yes"),
									getLocalizedText("no")
								])).then(function() {
									var entry = getBlogEntry(data.url);

									delete entry.disabled;
									$.when(setBlogEntry(data.url, entry))
										.always(function() {
												refreshBlogOptions(entry);
										});
								});
							}
						})
						.button()
					.end()
					.find(".disableBlog")
						.on({
							"click": function(e) {
								var data = $(this).data();

								$.when($.confirm(localizedFormat("confirmDisableBlog", data.title || data.url), undefined, [
									getLocalizedText("yes"),
									getLocalizedText("no")
								])).then(function() {
									var entry = getBlogEntry(data.url);

									entry.disabled = true;
									$.when(setBlogEntry(data.url, entry))
										.always(function() {
											refreshBlogOptions(entry);
										});
								});
							}
						})
						.button()
					.end()
					.find(".addBlog")
						.on({
							"click": function(e) {
								var data = $(this).data();

								$.when($.confirm(localizedFormat("confirmAddBlog", data.title), undefined, [
									getLocalizedText("yes"),
									getLocalizedText("no")
								])).then(function() {
									var pageIndex = parseInt(window.sessionStorage.getItem("blogPage")) || 0,
										posts = $.map($.makeArray($("#blogPage").find(".blogPost")), function(postElement) {
											return $(postElement).data("post");
										});

									/* !!!*/ pageIndex = 0; /* !!! */
									$.when(setLastViewedDate(data.title, data.url,
										(!pageIndex || !posts.length) ? data.updated : posts[0].timestamp,
										data.posts - (pageIndex * _options.postsPerPage),
										pageIndex, undefined, data.is_nsfw, data.blog.data.login_required)).always(function() {

										removeFromReadLater(data.url);
										refreshBlogOptions(getBlogEntry(data.url));
									});
								});
							}
						})
						.button();

				$(".toTop")
					.button({
						"icons": {
							"primary": "ui-icon-arrowthickstop-1-n"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							scrollContentToTop(true);
						}
					});

				$(document).on({
					"click": function(e) {
						$(document.body).data("snapper").close();
						$(".fullScreenImageSizeList").slideUp();
					}
				});

				$("#content").add($("#blogPageContainer")).on({
					"scroll": function(e) {
						var scrollerElement = getBlogPageScroller(),
							scrollerTop = scrollerElement.position().top,
							scrollerHeight = scrollerElement.height();

						$(".toTop")[(scrollerElement.scrollTop()) ?
							"fadeIn" :
							"fadeOut"]();

						if (HIDE_OFFSCREEN_ANIMATIONS &&
							!$.keyboard.isPressed("q")) {

							$("#blogPage").find(".photo").filter(function(i, photoElement) {
								return (photoElement = $(photoElement)).attr("src") &&
									photoElement.data("isAnimated") &&
									!photoElement.hasClass("ui-state-error");
							}).each(function(i, photoElement) {
								var offsetTop = (photoElement = $(photoElement))
										.position().top - scrollerTop,
									contentBottom = offsetTop + photoElement.height(),
									visibility = (contentBottom < 0 || offsetTop > scrollerHeight) ?
										"hidden" : "visible";

								if (photoElement.css("visibility") !== visibility) {
									photoElement.css({
										"visibility": visibility
									});
								}
							});
						}
						checkNonPreloadedImages();
					}
				});
				$(".blogHeader").hide();

				var fullScreenContainerElement = $(".fullScreenContainer"),
					fullScreenElement = $(".fullScreen")
						.on({
							"click": function(e) {
								if ($(e.target).closest("img").length) {
									setFullScreenZoom(!fullScreenElement
										.hasClass("zoomed"));
								} else if ($(e.target).closest("audio").length ||
									$(e.target).closest("video").length ||
									$(e.target).closest(".video").length) {

									e.stopPropagation();
								} else {
									fullScreenElement
										.find("audio")
										.add(fullScreenElement
											.find("video"))
										.each(function(i, video) {
											video.pause();
										});
									fullScreenElement
										.parent()
										.fadeOut();
								}
							}
						});

				fullScreenContainerElement
					.find(".previousPost")
					.button({
						"icons": {
							"primary": "ui-icon-triangle-1-w"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							e.preventDefault();
							previousSlide(true);
						}
					});
				fullScreenContainerElement
					.find(".previous")
					.button({
						"icons": {
							"primary": "ui-icon-carat-1-w"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							e.preventDefault();
							previousSlide();
						}
					});
				fullScreenContainerElement
					.find(".next")
					.button({
						"icons": {
							"primary": "ui-icon-carat-1-e"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							e.preventDefault();
							nextSlide();
						}
					});
				fullScreenContainerElement
					.find(".nextPost")
					.button({
						"icons": {
							"primary": "ui-icon-triangle-1-e"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							e.preventDefault();
							nextSlide(true);
						}
					});
				fullScreenContainerElement
					.find(".closeFullScreen")
					.button({
						"icons": {
							"primary": "ui-icon-closethick"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							e.preventDefault();
							fullScreenElement.parent().fadeOut();
						}
					});
				fullScreenContainerElement
					.find(".fullScreenDownload")
					.button({
						"icons": {
							"primary": "ui-icon-arrowthickstop-1-s"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							var href = $(e.target).closest("a").attr("href"),
								post = fullScreenContainerElement.data("post");

							if (_options.nativeDownload) {
								setFileDownloaded(href, post);
							} else {
								e.preventDefault();
								_downloadManager.downloadPost(post, post.download_url || href);
							}
						}
					});
				fullScreenContainerElement
					.find(".fullScreenFullScreen")
					.button({
						"icons": {
							"primary": "ui-icon-arrow-4-diag"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							e.preventDefault();
							requestFullScreenElement($(e.target).closest("a").data("mediaElement"));
						}
					});
				fullScreenContainerElement
					.find(".imageSearch")
					.button({
						"icons": {
							"primary": "ui-icon-search"
						},
						"text": false
					})
					.each(function(i, item) {
						var button = $(item);

						button
							.find(".ui-button-icon-primary")
							.css({
								"background-image": "url(\"{0}\")"
									.format(button.data("backgroundimage"))
							});
					});
				swiper({
					"appendTo": fullScreenContainerElement,
					"swipeLeft": function(e) {
						nextSlide();
					},
					"swipeRight": function() {
						previousSlide();
					},
					"swipeThreshold": 40
				});

				$(".loginButton")
					.add($(".changePasswordButton"))
					.add($(".setPasswordButton"))
					.add($(".cancelButton"))
					.button();

				$(".loginDialog").attr({
					"title": getLocalizedText("connect")
				});

				$(".changePasswordDialog").attr({
					"title": getLocalizedText("changePassword")
				});

				$(".cancelButton").on({
					"click": function(e) {
						$(e.target)
							.closest(".dialog")
							.dialog("close");
					}
				});

				$(PROXIES).eachProp(function(i, item) {
					PROXIES[i] = $.grep($.CORS.proxies, function(proxy, j) {
						return proxy.name === PROXIES[i];
					})[0];
				});

				window.setTimeout(function() {
					$(document.body).addClass("transitionable");
					applyPageOptions();
					clearBlogPage();
					$.when(_downloads.load()).then(reconnect);
				}, DEFAULT_TIMEOUT);
			});
		});
	};

	var loadPost = function(blog, container, post, pageIndex, postsDifference, newPosts, posts, hasFilter) {
		var buttonsElement,
			buttonText,
			downloadButton,
			downloadButtonSet,
			downloadInfoButton,
			hasDownloadText,
			listElement,
			photo2Index,
			postContentElement,
			postElement,
			postText,
			postTitleElement,
			textElement = $(document.createElement("div")),
			videoElement,
			waitFor;

		postElement = $(document.createElement("div"))
			.addClass("ui-corner-all")
			.addClass("blogPost")
			.addClass((post.isNewPost) ?
				"newPost" :
				(post.index === newPosts) ?
					"firstNonNewPost" :
					undefined)
			.addClass(post.type + "Post")
			.addClass((post.sticky) ?
				"stickyPost" :
				undefined)
			.attr({
				"postID": post.id
			})
			.data({
				"post": post
			})
			/* .append((!isNaN(parseInt(post.fullIndex))) ? $(document.createElement("div"))
				.addClass("postIndex")
				.data({
					"postIndex": post.fullIndex
				})
				.text((post.isNewPost) ?
					localizedFormat("two2", post.fullIndex + 1, (postsDifference > 0) ?
						((pageIndex * _options.postsPerPage) + newPosts > postsDifference) ?
							localizedFormat("lessThanZero", (pageIndex * _options.postsPerPage) + newPosts) :
							postsDifference :
						(newPosts < posts) ?
							(pageIndex * _options.postsPerPage) + newPosts :
							localizedFormat("lessThanZero", (pageIndex + 1) * _options.postsPerPage)) :
					(post.fullIndex + 1).toLocaleString()) : undefined) */
			.append($(document.createElement("div"))
				.addClass("postIndex")
				.data({
					"postIndex": post.fullIndex
				})
				.text((!isNaN(parseInt(post.fullIndex))) ?
					(post.isNewPost) ?
						localizedFormat("two2", post.fullIndex + 1, (postsDifference > 0) ?
							((pageIndex * _options.postsPerPage) + newPosts > postsDifference) ?
								localizedFormat("lessThanZero", (pageIndex * _options.postsPerPage) + newPosts) :
								postsDifference :
							(hasFilter || newPosts < posts) ?
								(pageIndex * _options.postsPerPage) + newPosts :
								localizedFormat("lessThanZero", (pageIndex + 1) * _options.postsPerPage)) :
						(post.fullIndex + 1).toLocaleString() :
					String.empty)
				.append($(document.createElement("a"))
					.addClass("loader")
					.button({
						"icons": {
							"primary": "ui-icon-loader-16"
						},
						"text": false
					})))
			.append(postTitleElement = $(document.createElement("div"))
				.addClass("postTitle")
				.append($(document.createElement("a"))
					.addClass("postTypeImage")
					.attr({
						"href": "#",
						"title": _textTable.postTypes[post.type]
					})
					.append((post.actual_type) ?
						getPostTypeImage({
							"type": post.actual_type
						}).addClass("actualType") :
						undefined)
					.append(getPostTypeImage(post)
						.addClass((post.actual_type) ?
							"originalType" :
							undefined))
					.on({
						"click": function(e) {
							window.sessionStorage.setItem("blogPostType", post.actual_type || post.type);
							window.sessionStorage.removeItem("blogPage");
							window.setTimeout(loadLastBlog);
							return e.preventAll();
						}
					}))
				.append((post.isNewPost) ? newImage() : undefined)
				.append($(document.createElement("a"))
					.addClass("postLink")
					.attr({
						"href": post.post_url,
						"target": "_blank",
						"title": post.post_url
					})
					.append(post.timestamp.toLocaleString()))
				.append(buttonsElement = $(document.createElement("span"))
					.addClass("postButtons")))
			.append(postContentElement = $(document.createElement("div"))
				.addClass("postContent"))
			.appendTo(container);

		postElement.find("a").each(function(i, item) {
			embedLink(item);
		});

		if (post.type === "photo") {
			(function() {
				var image,
					largest = {
						"height": 0,
						"width": 0
					};

				$(post.photos).each(function(i, photo) {
					$(photo.alt_sizes).each(function(j, size) {
						if (size.width > largest.width && size.height > largest.height) {
							largest = size;
						}
					});
				});

				if (largest.width > largest.height) {
					if (largest.width >= FULLHD.width && largest.height >= FULLHD.height) {
						image = FULLHD.horizontalImage;
					} else if (largest.width >= HD.width && largest.height >= HD.height) {
						image = HD.horizontalImage;
					}
				} else if (largest.width >= FULLHD.height && largest.height >= FULLHD.width) {
					image = FULLHD.verticalImage;
				} else if (largest.width >= HD.height && largest.height >= HD.width) {
					image = HD.verticalImage;
				}
				if (image) {
					buttonsElement.append($(document.createElement("img"))
						.addClass("hdPost")
						.attr({
							"src": image
						}));
				}
			})();
		}
		if (post.tags && post.tags.length) {
			buttonsElement.append(createPopoverButton({
				"icon": "ui-icon-tag",
				"items": $.map(post.tags, function(tag) {
					return {
						"click": function(e) {
							searchTag($(e.target)
								.closest(".popoverInnerButton")
								.data("tag"));
						},
						"data": {
							"tag": tag
						},
						"text": tag
					};
				}),
				"text": true,
				"title": post.tags.length.toLocaleString()
			}).addClass("postButton")
				.addClass("tagsButton"));
		}
		if (post.type === "photo") {
			buttonsElement.append(createPopoverButton({
				"icon": "ui-icon-arrow-4-diag",
				"items": $.map(post.original_photos || post.photos, function(photo, i) {
					return {
						"items": $.map(photo.alt_sizes, function(size) {
							return {
								"attr": {
									"href": size.url
								},
								"className": "sizeItem",
								"dontPrevent": true,
								"text": localizedFormat("size", size.width, size.height)
							}
						}),
						"text": (photo.caption && photo.caption.length) ?
							sameSource(photo.caption) :
							localizedFormat("photoIndex", i + 1)
					};
				}),
				"onShow": function(target) {
					var images = postElement
						.find("img.photo")
						.add(postElement
						.find("img.photo-2"));

					$(target)
						.find(".sizeItem")
						.removeClass("ui-state-highlight")
						.each(function(i, item) {
							var imageSizeURL = window.location.noProtocol((item = $(item)).attr("href"));

							if (images.filter(function(j, image) {
									return window.location.noProtocol($(image).data("src")) === imageSizeURL;
								}).length) {

								item.addClass("ui-state-highlight");
							}
						});
				},
				"text": true,
				"title": $.map(post.original_photos || post.photos, function(photo) {
					return photo.alt_sizes.length.toLocaleString();
				}).join(", ")
			}).addClass("postButton")
				.addClass("imageSizesButton"));
		}
		if (post.download_url && post.download_url.length) {
			hasDownloadText = post.type === "video" &&
				!_options.embedVideos &&
				post.durationText &&
				post.durationText.length;
			buttonsElement.append(downloadButtonSet = $(document.createElement("span"))
				.addClass("postButton")
				.addClass("downloadButton")
				.append(downloadButton = $(document.createElement("a"))	/* 'A' button: OK */
					.addClass("buttonSetItem")
					.addClass("downloadFileButton")
					.attr({
						"download": getDownloadFileName(post),
						"href": post.download_url,
						"target": "_blank",
						"title": getDownloadTitle(post)
					})
					.data({
						"downloadText": getDownloadText(post),
						"post": post
					})
					.on({
						"click": function(e) {
							var link = $(e.target)
								.closest("a"),
								post = link.data("post");

							if (_options.nativeDownload) {
								setFileDownloaded(link.attr("href"), post);
							} else {
								e.preventDefault();
								_downloadManager.downloadPost(post);
							}
						}
					})
					.button({
						"icons": {
							"primary": (_options.nativeDownload) ?
								"ui-icon-arrowthickstop-1-s" :
								"ui-icon-extlink"
						},
						"label": post.durationText,
						"text": hasDownloadText
					})));
			downloadInfoButton = createDownloadInfoButton(downloadButtonSet, post)
				.addClass("buttonSetItem");
			downloadButtonSet.buttonset({
				"items": ".buttonSetItem"
			});
			if (!hasDownloadText) {
				downloadButton
					.find(".ui-button-text")
					.html("&nbsp;");
			}
			setLinkDownloaded(downloadButton.add(downloadInfoButton), post);
		}
		if (post.type === "video" &&
			_options.embedVideos) {

			buttonsElement.append($(document.createElement("button"))
				.addClass("postButton")
				.addClass("fullScreenButton")
				.attr({
					"type": "button"
				})
				.data({
					"post": post
				})
				.button({
					"icons": {
						"primary": "ui-icon-arrow-4-diag"
					},
					"label": post.durationText,
					"text": !!(post.durationText && post.durationText.length)
				})
				.on({
					"click": function(e) {
						showFullScreen($(e.target).closest(".ui-button").data("post"));
					}
				}));
			if (!(post.durationText && post.durationText.length)) {
				buttonsElement
					.find(".ui-button-text")
					.last()
					.html("&nbsp;");
			}
		}

		if (post.note_count) {
			buttonsElement.append($(document.createElement("span"))
				.addClass("notes")
				.text(localizedFormat("notes", post.note_count)));
		}

		switch (post.type) {
			case "answer":
				textElement
					.append($(document.createTextNode(localizedFormat("asked",
						post.asking_name))))
					.append($(document.createElement("br")))
					.append($(document.createElement("br")))
					.append($(document.createElement("div"))
						.html(sameSource(post.question)))
					.append($(document.createElement("br")))
					.append($(document.createElement("br")))
					.append($(document.createElement("div"))
						.html(sameSource(post.answer)));
				break;
			case "audio":
				var audioText = localizedFormat("audioTitle",
						post.artist || getLocalizedText("unknownArtist"),
						post.track_name || getLocalizedText("unknownTrackName"),
						post.album || getLocalizedText("unknownAlbum"));

				postElement
					.find(".postLink")
					.addClass("audioPost");
				textElement
					.append($(document.createElement("div"))
						.html(sameSource(post.caption)))
					.append($(document.createElement("br")));
				if (post.download_url && post.download_url.length) {
					$(document.createElement("a"))
						.addClass("audioLink")
						.attr({
							"download": getDownloadFileName(post),
							"href": post.download_url,
							"target": "_blank",
							"title": audioText
						})
						.data({
							"post": post
						})
						.on({
							"click": function(e) {
								if (_options.enableFullScreenViewer && e.which === 1) {
									e.preventDefault();
									showFullScreen($(e.target).closest("a").data("post"));
								}
							}
						})
						.append(audioText)
						.appendTo(postContentElement);
					postContentElement.append($(document.createElement("br")))
						.append($(document.createElement("br")));
				}
				if (post.album_art && post.album_art.length) {
					postContentElement
						.append($(document.createElement("img"))
							.addClass("album_art")
							.attr({
								"src": post.album_art
							}));
				}
				break;
			case "chat":
			case "text":
				if (post.title) {
					textElement.append($(document.createElement("div"))
						.html(autoHide(blog, sameSource(post.title))));
				}
				if (post.body) {
					if (post.title) {
						textElement.append($(document.createElement("br")));
					}
					if (post.type === "chat") {
						listElement = $(document.createElement("ul"))
							.addClass("chatList")
							.appendTo(textElement);

						$(post.body.split("\n")).each(function(i, line) {
							var chatLineElement = $(document.createElement("li"))
								.appendTo(listElement);

							if ((line = $.trim(line)).length) {
								chatLineElement
									.append($(document.createElement("span"))
										.html("&mdash;&nbsp;&nbsp;"))
									.append($(document.createTextNode(line)));
							} else {
								chatLineElement.html("&nbsp;");
							}
						});
					} else {
						textElement
							.append($(document.createElement("div"))
								.html(autoHide(blog, sameSource(post.body))));
					}
					textElement
						.find("[data-provider=youtube]").each(function(i, item) {
							var url = (item = $(item)).data("url");

							if (url && url.length) {
								url = window.decodeURIComponent(url);
								item
									.before($(document.createElement("a"))
										.addClass("youtube-link")
										.attr({
											"href": url
										})
										.text(url))
									.before($(document.createElement("br")));
							}
						});
				}
				break;
			case "link":
				textElement
					.append($(document.createElement("a"))
						.attr({
							"href": post.url,
							"title": post.title
						})
						.text(post.title || getLocalizedText("link")))
					.append($(document.createElement("br")))
					.append($(document.createElement("div"))
						.html(autoHide(blog, sameSource(post.description))));
				break;
			case "photo":
				$(post.original_photos || post.photos).each(function(i, photo) {
					$(document.createElement("a"))
						.attr({
							"href": photo.original_size.url,
							"photoID": photo.photoID
						})
						.on({
							"click": function(e) {
								return photoClick(e);
							}
						})
						.append($(document.createElement("img"))
							.addClass("photo")
							.data({
								"index": i,
								"isAnimated": isAnimated(photo.original_size.url),
								"post": post
							}))
						.appendTo(postContentElement);

					if (photo.caption && photo.caption.length) {
						postContentElement
							.append($(document.createElement("br")))
							.append($(document.createElement("span"))
								.html(autoHide(blog, sameSource(photo.caption))))
							.append($(document.createElement("br")));
					}
				});
				textElement.html(autoHide(blog, sameSource(post.caption)));
				break;
			case "quote":
				textElement
					.append($(document.createElement("div"))
						.html("\u00ab" + $.trim(autoHide(blog, sameSource(post.text))) + "\u00bb"));
				if (post.source) {
					textElement
						.append($(document.createElement("br")))
						.append($(document.createElement("br")))
						.append($(document.createElement("div"))
							.html(autoHide(blog, sameSource(post.source))));
				}
				break;
			case "video":
				postElement
					.find(".postLink")
					.addClass("videoPost");

				$(document.createElement("br"))
					.appendTo(postContentElement);

				if (post.permalink_url && post.permalink_url.length) {
					$(document.createElement("a"))
						.addClass("permalink")
						.attr({
							"href": post.permalink_url,
						})
						.text(post.permalink_url)
						.appendTo(postContentElement);
					$(document.createElement("br"))
						.appendTo(postContentElement);
				}
				if (post.html5_capable) {
					if (_options.embedVideos)  {
						videoElement = $(document.createElement("div"))
							.addClass("embeddedVideoContainer");
					} else if (_options.enableFullScreenViewer) {
						videoElement = $(document.createElement("a"))
							.attr({
								"href": "#"
							});
					}
				}
				if (!videoElement &&
					post.thumbnail_url &&
					post.thumbnail_url.length) {

					videoElement = $(document.createElement("div"));
				}
				if (videoElement) {
					if (!videoElement.hasClass("embeddedVideoContainer") &&
						post.thumbnail_url &&
						post.thumbnail_url.length) {

						$(document.createElement("img"))
							.addClass("videoThumbnail")
							.attr({
								"alt": post.thumbnail_url,
								"has-src": String.empty
							})
							.data({
								"src": post.thumbnail_url
							})
							.appendTo(videoElement);
					}

					videoElement.data({
						"post": post
					}).appendTo(postContentElement);

					if (_options.enableFullScreenViewer &&
						post.html5_capable &&
						!_options.embedVideos) {
						videoElement.on({
							"click": function(e) {
								var clickedPost = $(e.target).closest("a").data("post");

								e.preventDefault();
								showFullScreen(clickedPost);
							}
						});
					}
				}
				textElement.html(autoHide(blog, sameSource(post.caption)));
				break;
		}

		postText = $.trim(textElement.html()
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, String.empty)
			.replace(/<iframe.*?\/iframe>/gi, function(iFrameData) {
				try {
					var host = iFrameData.match(/data-src="(.*?)"/i),
						i,
						parts;

					if (host && host.length) {
						host = host
							.pop()
							.replace(/^\/+/, String.empty)
							.replace(/\/+$/, String.empty)
							.split("/")[0];

						if (host && host.length) {
							parts = host.split(".");
							if (parts[0].match(/www/i)) {
								parts.splice(0, 1);
							}
							host = parts.join(".");
							for (i = 0; i < IFRAME_ALLOWED_HOSTS.length; i++) {
								if (host.toLowerCase() === IFRAME_ALLOWED_HOSTS[i].toLowerCase()) {
									return iFrameData;
								}
							}
						}
					}
				} catch (e) {
					try {
						if (window.console && window.console.warn) {
							window.console.warn(iFrameData);
						}
					} catch (e) { }
				}
				return String.empty;
			})
			.replace(/autoplay="autoplay"/gi, String.empty));
		if (postText && postText.length) {
			postContentElement.append(textElement = $(document.createElement("div"))
				.html(postText));
			if (post.photos && post.photos.length) {
				photo2Index = (post.original_photos || [ ]).length;
				textElement.find("img").each(function(i, item) {
					var url = (item = $(item)).data("src");

					if (!item.hasClass("photo") &&
						!(post.album_art && post.album_art.length &&
							window.location.noProtocol(post.album_art) === window.location.noProtocol(url))) {

						try {
							if (window.tumblr.isPhotoURL(url)) {
								item.data({
									"isAnimated": isAnimated(url),
									"photoIndex": photo2Index,
									"post": post
								});
								item.removeAttr("srcset");
								$(document.createElement("a"))
									.addClass("photo-2")
									.attr({
										"href": post.photos[photo2Index].original_size.url,
										"photoID": post.photos[photo2Index].photoID
									})
									.appendTo(item.parent())
									.append(item).on({
										"click": function(e) {
											return photoClick(e);
										}
									});
							}
						} catch (e) { }
						photo2Index++;
					}
				});
			}
			textElement.find("a").each(function(i, item) {
				var processResult = processLink(item = $(item));

				var complete = function() {
					if (!item.hasClass("photo-2")) {
						embedLink(item);
						createLinkMenu(item);
					}
				};

				if (processResult) {
					waitFor = $.Deferred(function(deferred) {
						$.when(processResult).then(deferred.resolve, deferred.reject).always(complete);
					});
				} else {
					complete();
				}
			});
		}

		if (post.tags && post.tags.length) {
			listElement = $(document.createElement("ul"))
				.appendTo(postElement);

			$(post.tags).each(function(i, tag) {
				$(document.createElement("a"))
					.attr({
						"href": "#",
					})
					.data({
						"tag": tag
					})
					.on({
						"click": function(e) {
							searchTag($(e.target).data("tag"));
							return e.preventAll();
						}
					})
					.text(tag)
					.appendTo($(document.createElement("li"))
						.addClass("expandedTag")
						.appendTo(listElement));
			});
		}

		if (isUselessPost(postElement, blog, post)) {
			postElement.addClass("useless");
		}

		if (postElement.hasClass("stickyPost") ||
			postElement.hasClass("useless")) {

			postElement
				.addClass("collapsed")
				.append($(document.createElement("button"))
					.addClass("expandButton")
					.attr({
						"type": "button"
					})
					.button({
						"icons": {
							"primary": "ui-icon-arrowthickstop-1-s"
						},
						"text": false
					})
					.on({
						"click": function(e) {
							$(e.target)
								.closest(".blogPost")
								.removeClass("collapsed");
							if (!$.keyboard.isPressed("q")) {
								loadNonPreloadedImages();
							}
						}
					}));
		}
		return waitFor;
	};

	var loadTheme = function() {
		if (_options.theme < $.ui.themes.length) {
			var theme = $.ui.themes[_options.theme],
				themeColor = theme.theme,
				themeColorElement = $("#" + THEMECOLOR_ID),
				themeElement = $("#" + THEME_ID),
				url = window.location.sameProtocol(theme.url);

			if (themeColorElement.length && themeColorElement.attr("content") !== themeColor) {
				themeColorElement.attr({
					"content": themeColor
				});
			}
			if (themeElement.length && themeElement.attr("href") !== url) {
				themeElement.attr({
					"href": url
				});
			}
		}
	};

	var loadThemes = function() {
		$("#options_theme")
			.themeSelector()
			.selectmenu({
				"appendTo": $(".optionsDialog"),
				"change": function(e, ui) {
					_options.theme = parseInt($(e.target).val());
					saveOptions();
					loadTheme();
				},
				"open": function(e, ui) {
					$(e.target).css({
						"z-index": $(e.target).closest(".ui-dialog").css("z-index") + 1
					});
				}
			});
		/* var themeElement = $("#options_theme").empty(),
			themeGroups = [ ],
			themeGroupsKeys = { };

		var isValidTheme = function(theme) {
			var valid = true,
				themeProtocol = theme.url.split("/")[0];

			if (themeProtocol &&
				themeProtocol.length &&
				themeProtocol.indexOf(":") &&
				window.location.protocol.match(/https/i)) {

				valid = themeProtocol.toLowerCase() ==
					window.location.protocol.toLowerCase();
			}
			return valid;
		};

		$($.ui.themes).each(function(i, theme) {
			if (isValidTheme(theme)) {
				if (!themeGroupsKeys[theme.group]) {
					themeGroupsKeys[theme.group] = theme.group;
					themeGroups.push(theme.group);
				}
			}
		});
		$(themeGroups).each(function(i, group) {
			var groupElement = $(document.createElement("optgroup"))
				.attr({
					"label": group
				})
				.appendTo(themeElement);
			$($.ui.themes).each(function(j, theme) {
				if (isValidTheme(theme) && theme.group === group) {
					$($.ui.themes).each(function(k, themeAgain) {
						if (themeAgain === theme) {
							groupElement.append($(document.createElement("option"))
								.text(themeAgain.name)
								.val(k));
							return false;
						}
					});
				}
			});
		});
		themeElement.selectmenu({
			"appendTo": $(".optionsDialog"),
			"change": function(e, ui) {
				_options.theme = parseInt(themeElement.val());
				saveOptions();
				loadTheme();
			},
			"open": function(e, ui) {
				$(".ui-selectmenu-open").css("z-index",
					themeElement.closest(".ui-dialog").css("z-index") + 1);
			}
		}); */
	};

	var localizedFormat = function(textID) {
		var newArguments = [ getLocalizedText(textID) ];

		for (var i = 1; i < arguments.length; i++) {
			var argument = arguments[i];

			if (argument !== undefined && argument !== null && typeof argument !== "string") {
				argument = (argument.toLocaleString) ?
					argument.toLocaleString() :
					argument.toString();
			}
			newArguments.push(argument);
		}
		return String.format.apply(this, newArguments);
	};

	var makeFiniteNumber = function(n) {
		if (!(typeof n === "number")) return 0;
		if (isNaN(n)) return 0;
		if (!isFinite(n)) return 0;
		return n;
	};

	var newImage = function(half) {
		return $(document.createElement("img"))
			.addClass("newImage")
			.attr({
				"src": (half) ?
					"images/halfNew.png" :
					"images/new.png"
			});
	};

	var nextSlide = function(nextPost) {
		var fullScreenContainerElement = $(".fullScreenContainer"),
			photoIndex = parseInt(fullScreenContainerElement.data("photoIndex")),
			post = fullScreenContainerElement.data("post"),
			posts = $("#blogPage").data("posts");

		if (!nextPost) {
			nextPost = !(post.photos && post.photos.length &&
				photoIndex < post.photos.length - 1);
		}
		if (nextPost) {
			for (var i = post.index + 1; i < posts.length; i++) {
				if (isSlidePost(posts[i])) {
					if (!$("[postid={0}]".format(posts[i].id)).hasClass("useless")) {
						switch (posts[i].type) {
							case "audio":
							case "video":
								showFullScreen(posts[i], undefined, true);
								break;
							case "photo":
							default:
								showFullScreen(posts[i], 0, true);
								break;
						}
						break;
					}
				}
			}
		} else if (photoIndex < post.photos.length - 1) {
			showFullScreen(post, photoIndex + 1, true);
		}
	};

	var openDialog = function(dialogElement, options) {
		options = options || { };
		hideStatus();
		return dialogElement.dialog($.extend({ }, options, {
			"close": function(e, ui) {
				if (options.close) {
					options.close.call(dialogElement, e, ui);
				}
				if (options.destroyOnClose) {
					window.setTimeout (function() {
						dialogElement.dialog("destroy");
					}, DEFAULT_TIMEOUT);
				}
			},
			"hide": true,
			"modal": true,
			"open": function(e, ui) {
				if (!options.dontCloseOnBackdropClick ||
					$.isFunction(options.dontCloseOnBackdropClick)) {

					dialogElement
						.dialog("instance")
						.overlay
						.off()
						.on({
							"click": function(e) {
								var buttons;

								if (e.which === 1) {
									if (!$.isFunction(options.dontCloseOnBackdropClick) ||
										!options.dontCloseOnBackdropClick()) {

										if ((buttons = $(e.target)
											.closest(".ui-dialog")
											.find(".ui-dialog-buttonpane")
											.find(".ui-button")).length) {

											buttons
												.last()
												.trigger("click");
										} else {
											dialogElement.dialog("close");
										}
									}
								}
							}
						});
				}
				if (options.open) {
					options.open.call(dialogElement, e, ui);
				}
			},
			"resizable": !!options.resizable,
			"show": true
		}));
	};

	var parseParameters = function() {
		var found,
			isBoolean,
			isInteger,
			maximum,
			name,
			optionValue,
			value;

		_originalOptions = { };
		for (name in _options) {
			value = window.location.get(name);

			if (value !== undefined) {
				_originalOptions[name] = optionValue = _options[name];

				if (typeof optionValue === "boolean") {
					value = !!parseInt(value);
				} else if (typeof optionValue === "number") {
					switch (name) {
						case "avatarSize":
							maximum = tumblr.AVATAR_SIZES.length - 1;
							break;
						case "postsPerPage":
							maximum = tumblr.MAX_POSTS_PER_PAGE - 1;
							break;
						case "theme":
							maximum = $.ui.themes.length - 1;
							break;
					}
					value = parseInt(value);
					if (isNaN(value) || (!isNaN(value) &&
						(!maximum || (value < 0 || value >= maximum)))) {

						value = undefined;
					}
				} else {
					switch (name) {
						case "postType":
							found = false;

							if (value.length) {
								for (var i = 0; i < tumblr.POST_TYPES.length; i++) {
									if (tumblr.POST_TYPES[i] === value) {
										found = true;
										break;
									}
								}
							}
							if (!found) {
								value = undefined;
							}
							break;
					}
				}
				if (value !== undefined) {
					_options[name] = value;
				}
			}
		}
	};

	var photoClick = function(e) {
		if (_options.enableFullScreenViewer && e.which === 1) {
			var index,
				target = $(e.target),
				image = target.closest("a")
					.find("img"),
				imageData;

			if (image.length) {
				imageData = image
					.first()
					.data();
			}
			e.preventDefault();
			e.stopPropagation();
			if (imageData) {
				index = imageData.index;

				if (index === undefined) {
					index = imageData.photoIndex;
				}
				showFullScreen(imageData.post, index);
			}
		}
	};

	var previousSlide = function(previousPost) {
		var fullScreenContainerElement = $(".fullScreenContainer"),
			photoIndex = parseInt(fullScreenContainerElement.data("photoIndex")),
			post = fullScreenContainerElement.data("post"),
			posts = $("#blogPage").data("posts");

		if (!previousPost) {
			previousPost = !(post.photos && post.photos.length &&
				photoIndex > 0);
		}
		if (previousPost) {
			for (var i = post.index - 1; i >= 0; i--) {
				if (isSlidePost(posts[i])) {
					if (!$("[postid={0}]".format(posts[i].id)).hasClass("useless")) {
						switch (posts[i].type) {
							case "audio":
							case "video":
								showFullScreen(posts[i], undefined, true);
								break;
							case "photo":
							default:
								showFullScreen(posts[i], posts[i].photos.length - 1, true);
								break;
						}
						break;
					}
				}
			}
		} else if (photoIndex > 0) {
			showFullScreen(post, photoIndex - 1, true);
		}
	};

	var processLink = function(link) {
		var href = (link = $(link)).attr("href");

		if (href && href.length) {
			if (href.match("\/iglive\.picshitz\.com\/")) {
				/* return */ $.Deferred(function(deferred) {
					$.ajax({
						error: deferred.reject,
						success: function(data) {
							var hasLinks = false;

							$(sameSource(data)).find(".postBody img").each(function(i, image) {
								var src = $(image).data("src");

								link.before($(document.createElement("img")).attr({
									/*"has-src": String.empty*/
									"src": (_isLocal) ? getProxiedURL(src) : src
								})/*.data({
									"src": getProxiedURL($(image).data("src"))
								})*/);
								hasLinks = true;
							});
							if (hasLinks) {
								link.before($(document.createElement("br")));
							}
							deferred.resolve();
						},
						url: getProxiedURL(href)
					});
				});
			}
		}
	};

	var reconnect = function(force) {
		var createDataStore = function() {
			var store = new firebaseDataStore8(DATASTORE3_API_KEY, DATASTORE_ID);

			store.getKey = window.firebaseDataStore8.getKey;
			if ((store.cleanup = window.firebaseDataStore8.cleanup) && CLEANUP_DATASTORE) {
				store.cleanup(DATASTORE_CLEANUP_INTERVAL);
			}

			for (var name in store.messages) {
				store.messages[name] = (_store) ? _store.messages[name] :
					getLocalizedText("dataStorage" +
						name[0].toUpperCase() + name.substr(1));
			}
			$(store).on({
				"error": function(e, error) {
					if (!store.errorsSuspended) {
						if (error.error.match(/QuotaExceededError/i) &&
							store.cleanup) {

							store.cleanup(DATASTORE_CLEANUP_INTERVAL);
						}
						$.toast.error(error.error);
					}
				},
				"message": function(e, message) {
					if (!store.messagesSuspended) {
						$.toast.message(String.format(message.message,
							window.formatFileSize(message.length)));
					}
				}
			});
			return store;
		},
		latestDates = window.sessionStorage.getItem("dates"),
		listAndLoadDates = function() {
			return $.when(_store.list(TABLE_DATES + "/")).then(function(data) {
				_dates = { };

				$(data).eachProp(function(name, value) {
					value.id = name;
					if (value.date) {
						value.date = new Date(value.date);
					}
					if (value.viewed) {
						value.viewed = new Date(value.viewed);
					}
					_dates[getBlogKey(value.url)] = value;
				});
				window.sessionStorage.setItem("dates", window.encodeURIComponent(window
					.JSON.stringify(_dates)));
			});
		},
		loginSucceeded = function() {
			window.loader.value(false);
			return window.loading(function() {
				return $.when(_dates || listAndLoadDates()).then(function() {
					if (_dates && !window.sessionStorage.getItem("startupDates")) {
						window.sessionStorage.setItem("startupDates",
							window.encodeURIComponent(window.JSON.stringify(_dates)));
					}
					return $.when(loadBlogs()).then(function() {
						window.sessionStorage.setItem("loaded", true);
					});
				});
			}, getLocalizedText((_dates) ?
				String.empty :
				"dataStorageDownloading"));
		},
		openStore = function() {
			var username = (_options.lastUsername && _options.lastUsername.length) ?
					_options.lastUsername :
					window.sessionStorage.getItem("lastUsername") || String.empty,
				password = (_options.lastPassword && _options.lastPassword.length) ?
					_options.lastPassword :
					window.sessionStorage.getItem("lastPassword") || String.empty;

				if (!(username && username.length)) {
					username = USERNAME;
				}
				if (!(password && password.length)) {
					password = PASSWORD;
				}

			var connectStore = function() {
				var message,
					restoreMessage;

				if (_store) {
					message = _store.messages.downloading;
					restoreMessage = true;
				}
				_store = window.dataStore = createDataStore();
				if (restoreMessage) {
					_store.messages.downloading = getLocalizedText("dataStorageConnected");
				}
				return $.when(_store.open(username, password, undefined,
					_store.getKey((username || String.empty).toLowerCase()))).then(function() {

					return $.when(_store.getItem("tumblr_auth")).then(function(tumblrAuth) {
						var changed = false;

						_tumblrAuth = tumblrAuth;
						window.sessionStorage.setItem("lastUsername", username);
						window.sessionStorage.setItem("lastPassword", password);
						if (_options.rememberMe) {
							if (_options.lastUsername !== username) {
								_options.lastUsername = username;
								changed = true;
							}
							if (_options.lastPassword !== password) {
								_options.lastPassword = password;
								changed = true;
							}
						} else {
							if (_options.lastUsername !== _defaults.lastUsername) {
								_options.lastUsername = _defaults.lastUsername;
								changed = true;
							}
							if (_options.lastPassword !== _defaults.lastPassword) {
								_options.lastPassword = _defaults.lastPassword;
								changed = true;
							}
						}
						if (changed) {
							saveOptions();
						}
					});
				}).always(function() {
					if (restoreMessage) {
						_store.messages.downloading = message;
					}
				});
			},
			showLogin = function() {
				return $.Deferred(function(deferred) {
					var resolved;

					$("#username").val(username);
					$("#password").val(password);
					$("#rememberMe").prop("checked", _options.rememberMe);
					openDialog($(".loginDialog"), {
						"close": function(e, ui) {
							if (!resolved && deferred.state() === "pending") {
								deferred.reject();
							}
						},
						"dontCloseOnBackdropClick": true,
						"open": function(e, ui) {
							$(".changePasswordButton").off().on({
								"click": function(e) {
									$("#username2").val($("#username").val());
									$(".setPasswordButton")
										.off()
										.on({
											"click": function(e) {
												var newUsername = $("#username2").val(),
													oldPassword = $("#password2").val(),
													newPassword = $("#newPassword").val(),
													newPassword2 = $("#newPassword2").val();

												if (newUsername && newUsername.length) {
													if (oldPassword && oldPassword.length) {
														if (newPassword && newPassword.length) {
															if (newPassword2 && newPassword2.length && newPassword === newPassword2) {
																window.loader.value(false);
																window.loading(function() {
																	_store.messages["passwordChanged"] = getLocalizedText("dataStoragePasswordChanged")
																		.format(newUsername);
																	return $.when(_store.changePassword(newUsername, oldPassword, newPassword))
																		.then(function() {
																			$(".changePasswordDialog").dialog("close");
																		}, function(error) {
																			$.toast.error(error);
																		});
																}, _store.messages["changingPassword"]);
															} else {
																$.toast.error(getLocalizedText("newPasswordMismatch"));
															}
														} else {
															$.toast.error(getLocalizedText("newPasswordRequired"));
														}
													} else {
														$.toast.error(getLocalizedText("oldPasswordRequired"));
													}
												} else {
													$.toast.error(getLocalizedText("usernameRequired"));
												}
												return e.preventAll();
											}
										});
									openDialog($(".changePasswordDialog"), {
										"dontCloseOnBackdropClick": true,
										"minWidth": $(window).width() * 0.5
									});
								}
							})[((_store = (_store || createDataStore())).changePassword) ? "show" : "hide"]();
							$(".loginButton").off().on({
								"click": function(e) {
									var rememberMe = $("#rememberMe").prop("checked");

									username = $("#username").val();
									password = $("#password").val();

									if (username && username.length) {
										if (password && password.length) {
											window.loader.value(false);
											window.showLoader(_store.messages["connecting"]);
											if (_options.rememberMe !== rememberMe) {
												_options.rememberMe = rememberMe;
												saveOptions();
											}
											$.when(connectStore()).then(function() {
												clearSession();
												_dates = undefined;
												resolved = true;
												$(".loginDialog").dialog("close");
												deferred.resolve();
												$.when(loginSucceeded()).always(window.hideLoader);
											}, function() {
												window.hideLoader();
											});
										} else {
											$.toast.error(getLocalizedText("passwordRequired"));
										}
									} else {
										$.toast.error(getLocalizedText("usernameRequired"));
									}
									return e.preventAll();
								}
							});
						},
						"minWidth": $(window).width() * 0.5
					});
				});
			};

			if (force || !(username && username.length && password && password.length)) {
				return showLogin();
			} else if (_store && _store.isOpen) {
				return loginSucceeded();
			} else {
				window.loader.value(false);
				window.showLoader(getLocalizedText("dataStorageConnecting"));
				return $.when(connectStore()).then(function() {
					return $.when(loginSucceeded()).always(window.hideLoader);
				}, function() {
					window.hideLoader();
					return showLogin();
				});
			}
		};

		if (!force && latestDates && latestDates.length) {
			_dates = $.parseJSON(window.decodeURIComponent(latestDates));
		}
		hideStatus();
		return openStore();
	};

	var refreshBlogLinks = function() {
		$("#blogPage").find(".blogLink").each(function(i, item) {
			var currentBlog = window.location.noProtocol(window.sessionStorage.getItem("blog") || "").split("/")[0],
				href = window.location.noProtocol((item = $(item)).attr("href")).split("/")[0],
				button = item.next(".ui-button"),
				icon = "ui-icon-triangle-1-s";

			if (button.length) {
				if ($.inArray(href, $(_dates).props()) < 0) {
					if (isInMyReadLater(href)) {
						icon = "ui-icon-clock";
					}
					button.removeClass("ui-state-highlight");
				} else {
					if (href === currentBlog) {
						icon = "ui-icon-star";
					}
					button.addClass("ui-state-highlight");
				}
				button.button("option", "icons", {
					"primary": icon
				});
			}
		});
	};

	var refreshBlogList = function(selectedItem) {
		var allHaveLessThanZeroPostsDifference = false,
			allNewBlogs = 0,
			allNewBlogs2 = 0,
			allNewPosts = 0,
			allNewPosts2 = 0,
			hadLessThanZeroPostsDifference = false,
			hasLessThanZeroPostsDifference = false,
			lastViewedDate,
			now = new Date(),
			newBlogs = 0,
			newPosts = 0,
			sfwHaveLessThanZeroPostsDifference = false,
			sfwNewBlogs = 0,
			sfwNewPosts = 0;

		$("#blogs")
			.find(".ui-state-focus")
			.removeClass("ui-state-focus");
		$("#blogs").find(".blog")
			.each(function(i, item) {
				var element = $(item),
					itemInfo = element.data("info"),
					postsDifference;

				if (itemInfo.exists) {
					var itemURL = itemInfo.url,
						itemDate = getLastUpdatedDate(itemURL),
						itemViewedDate = getLastViewedDate(itemURL);

					if (selectedItem && selectedItem.url === itemURL) {
						element.addClass("ui-state-focus");
					}
					element.find(".newImage").hide();
					if (itemViewedDate && (!lastViewedDate || (lastViewedDate < itemViewedDate))) {
						lastViewedDate = itemViewedDate;
					}
					if (element.hasClass("newBlog")) {
						postsDifference = itemInfo.posts - getLastViewedPosts(itemURL, true);

						if (_options.nsfw || !itemInfo.nsfw) {
							allNewBlogs++;
							allNewPosts += Math.max(postsDifference, 0);
							hadLessThanZeroPostsDifference = hadLessThanZeroPostsDifference ||
								(postsDifference <= 0 && itemInfo.posts > 0);
							if (itemDate.getTime() < itemInfo.updated.getTime()) {
								postsDifference = element.data("postsDifference") || 0;
								element.find(".newImage").attr({
									"src": (postsDifference > 0 && postsDifference < _options.postsPerPage) ?
										"images/halfNew.png" : "images/new.png"
								}).show();
								newPosts += Math.max(postsDifference, 0);
								hasLessThanZeroPostsDifference = hasLessThanZeroPostsDifference ||
									(postsDifference <= 0 && itemInfo.posts > 0);
								newBlogs++;
								if (!itemInfo.nsfw) {
									sfwNewBlogs++;
									if (postsDifference <= 0 && itemInfo.posts > 0) {
										sfwHaveLessThanZeroPostsDifference = true;
									}
									sfwNewPosts += Math.max(postsDifference, 0);
								}
							}
						} else if (itemDate.getTime() < itemInfo.updated.getTime()) {
							allNewBlogs2++;
							postsDifference = element.data("postsDifference") || 0;
							allNewPosts2 += Math.max(postsDifference, 0);
						}
						allHaveLessThanZeroPostsDifference = allHaveLessThanZeroPostsDifference ||
							(postsDifference <= 0 && itemInfo.posts > 0);
					}
				}
			});
		refreshSnapperButton(newBlogs);
		$("#blogs")
			.data({
				"lastViewedDate": lastViewedDate
			})
			.find(".newBlogsHeader")
			.data({
				"allHaveLessThanZeroPostsDifference": allHaveLessThanZeroPostsDifference,
				"allNewBlogs": newBlogs + allNewBlogs2,
				"allNewPosts": newPosts + allNewPosts2,
				"hasLessThanZeroPostsDifference": hasLessThanZeroPostsDifference,
				"length": newBlogs,
				"newPosts": newPosts,
				"sfwNewBlogs": sfwNewBlogs,
				"sfwNewPosts": sfwNewPosts,
				"sfwHaveLessThanZeroPostsDifference": sfwHaveLessThanZeroPostsDifference
			})
			.find(".text")
				.first()
					.empty()
					.append($(document.createTextNode(localizedFormat("newBlogsTitle",
						newBlogs, allNewBlogs))))
					.append($(document.createTextNode(" ")))
					.append($(document.createElement("span"))
						.text(localizedFormat("newPostsTitle",
							(hasLessThanZeroPostsDifference) ?
								localizedFormat("lessThanZero", newPosts) :
								newPosts,
							(hadLessThanZeroPostsDifference) ?
								localizedFormat("lessThanZero", allNewPosts) :
								allNewPosts)))
					.end()
				.end()
			.off()
			.on({
				"click": function(e) {
					showNewBlogsStatus(function(e) {
						showBlogsStatus("new");
					});
					return e.preventAll();
				}
			})
			[(allNewBlogs) ? "show" : "hide"]();
		$("#blogs")
			.find(".readBlogsHeader")
			.off()
			.on({
				"click": function(e) {
					showBlogsStatus("read");
					return e.preventAll();
				}
			});
		$("#blogs")
			.find(".oldBlogsHeader")
			.off()
			.on({
				"click": function(e) {
					showBlogsStatus("old");
					return e.preventAll();
				}
			});
	};

	var refreshBlogOptions = function(info) {
		var data = {
			"title": info.title,
			"url": info.url
		},
		isInBlogs = isInMyBlogs(info);

		$(".pageOptionsDialog")
			.find(".blogOptions")[(isInBlogs) ? "show" : "hide"]();
		$(".pageOptionsDialog")
			.find(".enableBlog")
				.data(data)[(isInBlogs && info.exists && info.disabled) ? "show" : "hide"]()
			.end()
			.find(".disableBlog")
				.data(data)[(isInBlogs && !info.disabled) ? "show" : "hide"]()
			.end()
			.find(".addBlog")
				.data(info)[(!isInBlogs) ? "show" : "hide"]();
	};

	var refreshBlogTitle = function(info, posts, newPosts, pageIndex) {
		refreshBlogList(info);

		var blogOptions = getBlogOptions(info.url),
			blogOption,
			blogTitle = info.title,
			defaultTitle = true,
			descriptionElement = $(document.createElement("div"))
				.html(sameSource(info.description)),
			hasFilter,
			hasNewVideo,
			hasNewVideoInOldPosts,
			hasNewVideoRequests = [ ],
			newPostsCount,
			newPostsSuffix,
			optionValue = "default",
			postsDifference = info.postsDifference,
			blogPostType = window.sessionStorage.getItem("blogPostType"),
			postType = blogPostType,
			tag = window.sessionStorage.getItem("blogTag");

		if (!(postType && postType.length)) {
			postType = _options.postType;
		}
		hasFilter = (tag && tag.length) ||
			(postType && postType.length);

		descriptionElement = $(".pageOptionsDialog")
			.data({
				"info": info
			})
			.find(".blogDescription")
			.find("div")
			.html(descriptionElement.html());

		if ($.trim(descriptionElement.text()).length) {
			descriptionElement.parent().show();
			descriptionElement.find("a").each(function(i, item) {
				embedLink(item);
				createLinkMenu(item);
			});
		} else {
			descriptionElement.parent().hide();
		}

		$(".pageOptionsDialog")
			.find(".archive")
			.attr({
				"href": info.archiveURL
			});
		$(".pageOptionsDialog")
			.find(".tagToSearch")
				.val(tag)
			.end()
			.find(".resetTag")
				[(tag && tag.length) ? "show" : "hide"]()
			.end()
			.find(".goToLastViewedPage")
				[(info.newPages) ? "show" : "hide"]()
			.end()
			.find(".resetPostType")
				.parent()
					[(blogPostType && blogPostType.length) ? "show": "hide"]()
				.end()
			.end()
			.find(".goToBlog")
				.attr({
					"href": window.location.sameProtocol(info.url)
				})
				.text(window.location.sameProtocol(info.url));

		refreshBlogOptions(info);

		if ((blogOption = blogOptions.imageSize) && blogOption.length &&
			$(".pageOptionsDialog")
				.find(String.format("[name=blogOptions_imageSize][value={0}]",
					blogOption)).length) {

			optionValue = blogOption;
		}

		$(".pageOptionsDialog")
			.find("[name=blogOptions_imageSize]")
			.off()
			.val([ optionValue ])
			.on({
				"change": function(e) {
					var currentOptions = getBlogOptions(info.url),
						currentValue = $(e.target).val(),
						hasProperties = false,
						name;

					if (currentValue === "default") {
						delete currentOptions.imageSize;
						for (name in currentOptions) {
							hasProperties = true;
							break;
						}
						if (!hasProperties) {
							currentOptions = undefined;
						}
					} else {
						currentOptions.imageSize = currentValue;
					}
					$.when(setBlogOptions(info.url, currentOptions)).then(function() {
						applyBlogPageOptions();
					});
				}
			});

		if ((blogOption = blogOptions.preloadImages) && blogOption.length &&
			$(".pageOptionsDialog")
				.find(String.format("[name=blogOptions_preloadImages][value={0}]",
					blogOption)).length) {

			optionValue = blogOption;
		}

		$(".pageOptionsDialog")
			.find("[name=blogOptions_preloadImages]")
			.off()
			.val([ optionValue ])
			.on({
				"change": function(e) {
					var currentOptions = getBlogOptions(info.url),
						currentValue = $(e.target).val(),
						hasProperties = false,
						name;

					if (currentValue === "default") {
						delete currentOptions.preloadImages;
						for (name in currentOptions) {
							hasProperties = true;
							break;
						}
						if (!hasProperties) {
							currentOptions = undefined;
						}
					} else {
						currentOptions.preloadImages = currentValue;
					}
					$.when(setBlogOptions(info.url, currentOptions)).then(function() {
						applyBlogPageOptions();
					});
				}
			});

		$(".pageOptionsDialog")
			.find("[name=blogOptions_forceNSFW]")
			.off()
			.val([ (info.force_nsfw !== undefined) ?
					(info.force_nsfw) ?
						"nsfw" :
						"sfw" :
					"noForce" ])
			.on({
				"change": function(e) {
					var currentValue = $(this).val(),
						entry = getBlogEntry(info.url);

					switch (currentValue) {
						case "nsfw":
							entry.force_nsfw = true;
							break;
						case "sfw":
							entry.force_nsfw = false;
							break;
						default:
							delete entry.force_nsfw;
							break;
					}
					setBlogEntry(info.url, entry);
				}
			});

		var bindBooleanOption = function(optionName) {
			$(".pageOptionsDialog")
				.find("[name=blogOptions_{0}]".format(optionName))
				.off()
				.prop("checked", !!blogOptions[optionName])
				.on({
					"change": function(e) {
						var currentOptions = getBlogOptions(info.url),
							currentValue = $(e.target).prop("checked"),
							hasProperties = false,
							name;

						if (currentValue) {
							currentOptions[optionName] = !!currentValue;
						} else {
							delete currentOptions[optionName];
							for (name in currentOptions) {
								hasProperties = true;
								break;
							}
							if (!hasProperties) {
								currentOptions = undefined;
							}
						}
						$.when(setBlogOptions(info.url, currentOptions)).then(function() {
							applyBlogPageOptions(true);
						});
					}
				});
		};

		bindBooleanOption("checkUselessPosts");
		bindBooleanOption("expandTags");

		if (posts && posts.length) {
			$(posts).each(function(i, post) {
				if (post.type !== "photo" &&
					post.download_url &&
					post.download_url.length) {

					hasNewVideoRequests.push($.when(isFileDownloaded(post.download_url))
						.then(function(downloaded) {
							if (!downloaded) {
								hasNewVideo = true;
								if (!post.isNewPost) {
									hasNewVideoInOldPosts = true;
								}
							}
						}));
				}
			});
			if (newPosts || pageIndex) {
				if (newPosts && newPosts < _options.postsPerPage) {
					newPostsSuffix = localizedFormat("newPostsSuffix", newPosts);
				} else if (postsDifference) {
					if (pageIndex === 0 && newPosts && newPosts > postsDifference) {
						newPostsSuffix = localizedFormat("newPostsSuffix",
							localizedFormat("lessThanZero", newPosts));
					} else {
						newPostsCount = _options.postsPerPage * ((pageIndex || 0) + 1);

						if ((hasFilter || postsDifference < 0 ||
							(!!newPosts && postsDifference < newPostsCount)) &&
							pageIndex * _options.postsPerPage > newPostsCount) {

							newPostsSuffix = localizedFormat("newPostsSuffix",
								localizedFormat("lessThanZero", newPostsCount));
						} else {
							newPostsSuffix = localizedFormat("newPostsSuffix", postsDifference);
						}
					}
				}
			}
		}
		if (tag && tag.length) {
			blogTitle = localizedFormat("taggedPosts",
				blogTitle, tag);
		} else if (postType && postType.length) {
			defaultTitle = false;
			blogTitle = localizedFormat("typedPosts",
				blogTitle, getPostCount(info), postType);
		}
		if (defaultTitle) {
			blogTitle = localizedFormat("blogTitle",
				blogTitle, (info.posts !== undefined) ?
					info.posts :
					getLocalizedText("no"));
		}

		$(".blogHeader").show();
		$(".blogPageTitle")
			.empty()
			.append($(document.createElement("a"))
				.attr({
					"href": "#"
				})
				.on({
					"click": function(e) {
						e.preventDefault();
						openDialog($(".pageOptionsDialog")
							.attr({
								"title": info.title
							}), {
								"buttons":[{
									"click": function(e) {
										$(this).dialog("close");
									},
									"text": getLocalizedText("ok")
								}],
								"destroyOnClose": true,
								"dialogClass": "centerButtons",
								"maxHeight": $(window).height() * 0.9,
								"minWidth": $(window).width() * 0.667,
								"open": function(e, ui) {
									$(".pageOptionsDialog")
										.find(".pageNumber")
										.val(info.blog.page + 1);
									refreshDownloadsButtons();
								}
							});
					}
				})
				.html(replaceHTMLNewLines(blogTitle)));
		if (tag && tag.length) {
			$(".blogPageTitle")
				.append($(document.createElement("button"))
					.attr({
						"type": "button"
					})
					.button({
						"icons": {
							"primary": "ui-icon-closethick"
						},
						"text": false
					}).on({
						"click": function(e) {
							searchTag();
							return e.preventAll();
						}
					}));
		}

		$.when.apply(this, hasNewVideoRequests).then(function() {
			$("#blogPage")[(hasNewVideo) ?
				"addClass" :
				"removeClass"]("hasNewVideo");
			$("#blogPage")[(hasNewVideoInOldPosts) ?
				"addClass" :
				"removeClass"]("hasNewVideoInOldPosts");

			if (newPostsSuffix && newPostsSuffix.length) {
				$(".blogPageTitle")
					.append($(document.createElement("span"))
						.addClass("newPostsSuffix")
						[(hasNewVideo) ?
							"addClass" :
							"removeClass"]("newVideo")
						.text(newPostsSuffix));
			}
		});
	};

	var refreshButton = function(button, number, icon, title) {
		$(button)[(number) ?
			"addClass" :
			"removeClass"]("ui-state-highlight")
			.attr({
				"title": title
			})
			.button("option", "icons", (number || 0) ? false : {
				"primary": icon
			})
			.button("option", "text", !!number)
			.button("option", "label", (number !== undefined) ?
				(number.toLocaleString) ?
					number.toLocaleString() :
					number.toString() :
				undefined);
	};

	var refreshDownloadsButtons = function(count) {
		var downloadCount = $("#blogPage").find(".downloadFileButton").length,
			downloadedCount = $("#blogPage").find(".downloadFileButton.downloaded").length,
			hasNewVideo,
			hasNewVideoInOldPosts,
			title;

		count = count || $(".downloadsProgressDialog")
			.find(".downloadList")
			.children()
			.length;
		title = localizedFormat("activeDownloads", count);
		if (hasNewVideo = downloadedCount < downloadCount) {
			$("#blogPage").find(".downloadFileButton").each(function(i, item) {
				if (!(item = $(item)).hasClass("downloaded") &&
					!item.closest(".blogPost").hasClass("newPost")) {

					hasNewVideoInOldPosts = true;
					return false;
				}
			});
		}

		$(".blogPageTitle")
			.find(".newPostsSuffix")
			[(downloadedCount < downloadCount) ?
				"addClass" :
				"removeClass"]("newVideo");
		$("#blogPage")
			[(hasNewVideo) ?
				"addClass" :
				"removeClass"]("hasNewVideo");
		$("#blogPage")
			[(hasNewVideoInOldPosts) ?
				"addClass" :
				"removeClass"]("hasNewVideoInOldPosts");
		$(".pageOptionsDialog")
			.find(".viewDownloads")
			.button("option", "label",
				localizedFormat("viewDownloads", (_options.showMissingDownloads) ?
					downloadCount - downloadedCount :
					downloadedCount, downloadCount));

		refreshButton(".downloads", count, "ui-icon-arrowthickstop-1-s", title);
		return refreshButton(".downloads2", count, "ui-icon-arrowthickstop-1-s", title);
	};

	var refreshReadLaterButton = function() {
		var count = (_readLater || [ ]).length;

		refreshButton(".readLater", count, "ui-icon-clock", localizedFormat("readLater", count));
	};

	var refreshSnapperButton = function(newBlogs) {
		return refreshButton(".snapper", (newBlogs) ?
			newBlogs :
			undefined, "ui-icon-grip-solid-horizontal");
	};

	var reloadPage = function() {
		clearSession();
		clearBlogPage();
		reconnect();
	};

	var removeFromReadLater = function(url) {
		if (url && url.length && _readLater && _readLater.length) {
			var index = $.inArray(url = window.location.noProtocol(url)
				.split("/")[0].toLowerCase(), _readLater);

			if (index >= 0) {
				_readLater.splice(index, 1);
				return saveReadLater(_readLater, true);
			} else {
				return $.Deferred(function(deferred) {
					deferred.reject();
				}).promise();
			}
		}
	};

	var removeGlobalUseless = function(useless) {
		if (useless && useless.length && _useless && _useless.length) {
			var i;

			if ((i = $.inArray(useless = useless.toLowerCase(), _useless.map(function(item) {
				return (item.test) ? item.source : item;
			}))) >= 0) {
				return $.when($.confirm(localizedFormat("confirmRemoveFromGlobalUseless", useless), undefined, [
						getLocalizedText("yes"),
						getLocalizedText("no")
					])).then(function() {
						_useless.splice(i, 1);
						saveGlobalUseless(_useless, true);
					});
			}
		}
	};

	var replaceHTMLNewLines = function(text) {
		var replaceWith = $(document.createElement("div"))
			.append(document.createElement("br"))
			.html();

		return (text || String.empty)
			.replace(/\r\n/g, replaceWith)
			.replace(/\n\r/g, replaceWith)
			.replace(/\r/g, replaceWith)
			.replace(/\n/g, replaceWith);
	};

	var requestFullScreenElement = function(element) {
		try {
			var m = getRequestFullScreen(element);

			if (m) {
				m.call(element);
			}
		} catch (e) { }
	};

	var sameSource = function(html) {
		return (html || String.empty)
			.replace(/ src=\"https*:\/\//gi, " has-src data-src=\"//")
			.replace(/ src=\\&quot;https*:\/\//gi, " has-src data-src=\\&quot;//");
	};

	var saveBlogs = function(blogs) {
		var values = [ ];

		$(blogs).each(function(i, blog) {
			var actualBlog = $.extend({ }, blog);

			delete actualBlog.toAutoUpdate;
			values.push(actualBlog);
		});
		window.sessionStorage.setItem("blogInfos",
			window.encodeURIComponent(window.JSON.stringify(values)));
	};

	var saveGlobalUseless = function(useless, saveOnDataStore) {
		if (useless && useless.length) {
			useless = useless.map(function(item) {
				if (item.test) {
					item = item.source;
				}
				return item;
			});
			useless.sort();
			window.localStorage.setItem(STORAGE_NAME_USELESS,
				window.JSON.stringify(_useless = useless));
		} else {
			window.localStorage.removeItem(STORAGE_NAME_USELESS);
			_useless = [ ];
		}
		if (saveOnDataStore) {
			return $.when(_store.setItem(TABLE_USELESS, _useless));
		}
	};

	var saveOptions = function() {
		if (window.JSON && window.JSON.stringify) {
			var localOptions = { }, name;

			for (name in _options) {
				var value = _options[name];

				if ($.isPlainObject(value) ||
					(value !== undefined &&
					_defaults[name] !== undefined &&
					value !== _defaults[name])) {

					localOptions[name] = value;
				}
			}
			if (_originalOptions) {
				for (name in _originalOptions) {
					if (_originalOptions[name] !== _defaults[name]) {
						localOptions[name] = _originalOptions[name];
					} else {
						delete localOptions[name];
					}
				}
			}
			window.localStorage.setItem(STORAGE_NAME, window.encodeURIComponent(window
				.JSON.stringify(localOptions)));
		}
	};

	var saveReadLater = function(readLater, saveOnDataStore) {
		if (readLater && readLater.length) {
			readLater.sort();
			window.localStorage.setItem(STORAGE_NAME_READLATER,
				window.JSON.stringify(_readLater = readLater));
		} else {
			window.localStorage.removeItem(STORAGE_NAME_READLATER);
			_readLater = [ ];
		}
		refreshReadLaterButton();
		refreshBlogLinks();
		if (saveOnDataStore) {
			return $.when(_store.setItem(TABLE_READLATER, _readLater));
		}
	};

	var scrollContentToTop = function(animate) {
		var scroller = getBlogPageScroller();

		if (animate) {
			scroller.animate({
				"scrollTop": 0
			});
		} else {
			scroller.scrollTop(0);
		}
	};

	var scrollToBlog = function(blogItem) {
		var container = $("#blogs").parent(),
			containerHeight = container.height(),
			itemHeight = (blogItem = $(blogItem)).height(),
			offset = blogItem.offset(),
			scrollTop;

		if (offset.top + itemHeight > containerHeight) {
			scrollTop = offset.top + container[0].scrollTop +
					itemHeight + 32 - containerHeight;
		} else if (offset.top < 0) {
			scrollTop = offset.top + container[0].scrollTop - 32;
		}
		if (scrollTop !== undefined) {
			container.animate({
				"scrollTop": scrollTop
			});
		}
	}

	var scrollToPost = function(post, photoIndex) {
		window.setTimeout(function() {
			var children,
				contentBottom,
				contentElement,
				contentHeight,
				offsetTop,
				scrollerElement = getBlogPageScroller(),
				scrollerHeight = scrollerElement.height();

			if (post.photos && post.photos.length) {
				contentElement = $("#blogPage")
					.find(String.format("[photoID={0}]",
						post.photos[photoIndex || 0].photoID));
			} else {
				switch (post.type) {
					case "video":
						contentElement = $("#blogPage")
							.find(String.format("[postID={0}]", post.id))
							.find((_options.embedVideos) ?
								".embeddedVideoContainer" :
								".videoThumbnail");
						break;
				}
			}
			if (contentElement && contentElement.length) {
				if ((children = contentElement.find("*")).length) {
					contentElement = children.first();
				}

				contentHeight = contentElement.height();
				offsetTop = contentElement.position().top +
					contentElement.closest(".blogPost").position().top -
					scrollerElement.position().top;
				contentBottom = offsetTop + contentHeight;

				if (offsetTop < 0 || contentBottom > scrollerHeight) {
					scrollerElement.animate({
						"scrollTop": scrollerElement.scrollTop() + offsetTop -
							(scrollerHeight - contentHeight) / 2
					});
				}
			}
		});
	};

	var searchTag = function(tagToSearch) {
		if (tagToSearch && tagToSearch.length) {
			window.sessionStorage.setItem("blogTag", tagToSearch);
		} else {
			window.sessionStorage.removeItem("blogTag");
		}
		window.sessionStorage.removeItem("blogPage");
		window.setTimeout(function() {
			loadLastBlog();
		});
	};

	var setBlogEntry = function(url, entry) {
		var dataStoreKey,
			entryCopy,
			key = getBlogKey(url),
			newDate,
			now = new Date(),
			updateEntries = function() {
				var infos = window.sessionStorage.getItem("blogInfos");

				if (!(entry.url && entry.url.length)) {
					entry.url = key;
				}
				if (infos && infos.length && entry.id && entry.id.length) {
					infos = $.parseJSON(window.decodeURIComponent(infos));

					$(infos).each(function(i, info) {
						if (info.id === entry.id) {
							info = _infos[i];
							info.blog.data = entry;
							info.disabled = entry.disabled;
							info.force_nsfw = entry.force_nsfw;
							info.login_required = entry.login_required;
							saveBlogs(_infos);
							return false;
						}
					});
				}
				window.sessionStorage.setItem("dates", window.encodeURIComponent(window
					.JSON.stringify(_dates)));
			};

		if (entry) {
			if (!(dataStoreKey = entry.id)) {
				dataStoreKey = _store.getKey(key);
			}
		}
		if (entry) {
			entry = $.extend({ }, entry);
			/* for (name in entry) {
				if ($.isPlainObject(entry[name])) {
					entry[name] = window.encodeURIComponent(window
						.JSON.stringify(entry[name]));
				}
			} */
			entryCopy = $.extend({ }, entry);
			entryCopy.url = key;
			for (name in entryCopy) {
				if (entryCopy[name].constructor === Date) {
					entryCopy[name] = entryCopy[name].toISOString();
				}
			}
			return $.when(_store[(_dates[key]) ?
				"setItem" :
				"addItem"](TABLE_DATES + "/" + dataStoreKey, entryCopy))
				.then(function(newKey) {

				if (newKey) {
					entry.id = newKey;
				}
				_dates[key] = entry;
				updateEntries();
			});
		} else {
			return $.when(_store.removeItem(TABLE_DATES + "/" + dataStoreKey)).then(function() {
				delete _dates[key];
				updateEntries();
			});
		}
	};

	var setBlogOptions = function(url, options) {
		var entry,
			key = getBlogKey(url);

		if (options) {
			return setBlogEntry(url, $.extend({ }, _dates[key], {
				"options": options
			}));
		} else {
			entry = _dates[key];
			if (entry && entry.options !== undefined) {
				entry = $.extend({ }, entry);
				delete entry.options;
				return setBlogEntry(url, entry);
			}
		}
	};

	var setDocumentLoading = function(n) {
		var pageElement = $(document.body),
			loadingCount = parseInt(pageElement.data("loading")) || 0,
			n = parseInt(n);

		if (!isNaN(n)) {
			pageElement.data({
				"loading": loadingCount + n
			});
			pageElement.find(".header").find(".loader").button({
				"label": loadingCount + n,
				"text": loadingCount + n > 1
			});

			if (n > 0) {
				if (loadingCount === 0) {
					pageElement.addClass("loading");
				}
			} else if (n < 0) {
				if (loadingCount + n === 0) {
					pageElement.removeClass("loading");
				}
			} else {
				pageElement
					.removeClass("loading")
					.removeData("loading");
			}
			_pageIconManager.refresh(pageElement.data("loading"));
		}
	};

	var setFileDownloaded = function(url, post, localOnly, reset) {
		var afterUpdate,
			download,
			key = _store.getKey(window.location.noProtocol(url)),
			now = new Date().toISOString(),
			restoreMessages = function() {
				delete _store.messagesSuspended;
			},
			saveInLocalStorage = function() {
				setLinkDownloaded($("[href=\"{0}\"]".format(url)), post);
				if (_options.downloadSynchronization !== "skip") {
					return _downloads.save();
				}
			},
			updateResult;

		if (post.type !== "photo" && url && url.length) {
			return $.when($.Deferred(function(deferred) {
				$.when(getDownload(key)).then(function(value) {
					deferred[(!!reset == !!(download = value)) ? "resolve" : "reject"]();
				}, function() {
					deferred[(reset) ? "reject" : "resolve"]();
				});
			})).then(function() {
				if (_options.downloadSynchronization !== "skip" && !localOnly) {
					_store.messagesSuspended = true;
					if (reset) {
						updateResult = _store.removeItem(TABLE_DOWNLOADS + "/" + download.key);
						afterUpdate = function() {
							return _downloads.delete(download.key);
						};
					} else {
						download = {
							"downloaded": now,
							"source": post.blog.title
						};
						if (post.duration) {
							download.duration = post.duration;
						}
						updateResult = _store.setItem(TABLE_DOWNLOADS + "/" + key, download);
						afterUpdate = function() {
							return _downloads.add(key, download);
						};
					}
					return $.when(updateResult).then(function() {
						return $.when((afterUpdate) ? afterUpdate() : true).then(function() {
							return $.when(_downloads.update()).then(function() {
								return $.when(_store.setItem(TABLE_DOWNLOADS + "/" + VALUE_DOWNLOADS_COUNT, _downloads.getCount()))
									.then(function() {
										return $.when(_store.setItem(TABLE_DOWNLOADS + "/" + VALUE_DOWNLOADS_DATE, _downloads.getDate().toISOString()))
											.then(function() {
												restoreMessages();
												return _store.setItem(TABLE_DOWNLOADS + "/" + VALUE_DOWNLOADS_SIZE, _downloads.getSize());
											}, restoreMessages);
									}, restoreMessages);
							});
						});
					}, restoreMessages).then(saveInLocalStorage);
				}
				return saveInLocalStorage();
			});
		}
	};

	var setFullScreenZoom = function(zoomOn) {
		var centerPhoto = function() {
				var offsetParent = fullScreenElement.offsetParent();

				offsetParent.one({
					"mousewheel touchmove": function(e) {
						offsetParent.stop();
					}
				}).animate({
					"scrollLeft": (photo.width * factor - offsetParent.width()) / 2,
					"scrollTop": (photo.height * factor - offsetParent.height()) / 2
				}, function() {
					offsetParent.off("mousewheel touchmove");
				});
			},
			factor = 1,
			fullScreenContainerElement = $(".fullScreenContainer"),
			fullScreenElement = fullScreenContainerElement.find(".fullScreen"),
			imageSearchElements = fullScreenContainerElement.find(".imageSearch"),
			imageSizeElement = fullScreenContainerElement.find(".fullScreenImageSize"),
			pageHeight = $(window).height(),
			pageWidth = $(window).width(),
			photo,
			photoElement = fullScreenElement.find("img"),
			showRatio,
			slideshowInfoElement = fullScreenContainerElement.find(".slideshowInfo"),
			slideshowToolbarElement = fullScreenContainerElement.find(".slideshowToolbar");

		if (zoomOn) {
			photo = photoElement.data("photo") || {
				"height": 0,
				"width": 0
			};

			/* if (window.devicePixelRatio && window.devicePixelRatio !== 1) {
				// factor /= window.devicePixelRatio / 1.28;
				// factor *= 1.01;
				showRatio = true; */
				/* pageWidth *= window.devicePixelRatio;
				pageHeight *= window.devicePixelRatio; */
			/* } */
			if (photo.width < pageWidth && photo.height < pageHeight) {
				photoElement.addClass("doubled");
				factor *= 2;
			} else {
				photoElement.removeClass("doubled");
			}

			slideshowInfoElement
				.addClass("zoomed");
			slideshowToolbarElement
				.addClass("zoomed");
			imageSizeElement
				.addClass("zoomed");
			imageSearchElements
				.addClass("zoomed");
			fullScreenElement
				.one({
					"webkitTransitionEnd oTransitionEnd otransitionend transitionend msTransitionEnd": function() {
						/* centerPhoto(); */
						slideshowToolbarElement.css({
							"visibility": "hidden"
						});
					}
				})
				.addClass("noSwipe")
				.addClass("zoomed")
				.css({
					"min-width": photo.width * factor,
					"min-height": photo.height * factor
				});
			centerPhoto();

			if (showRatio) {
				$.toast("Device pixel ratio: {0}\nScale factor: {1}\nPhoto width: {2}\nPhoto height: {3}"
					.format(window.devicePixelRatio, Math.roundTo(factor, 3),
						fullScreenElement.css("min-width"), fullScreenElement.css("min-height")));
			}
		} else {
			slideshowInfoElement
				.removeClass("zoomed");
			slideshowToolbarElement
				.css({
					"visibility": "visible"
				})
				.removeClass("zoomed");
			imageSizeElement
				.removeClass("zoomed");
			imageSearchElements
				.removeClass("zoomed");
			fullScreenElement
				.removeClass("noSwipe")
				.removeClass("zoomed")
				.css({
					"min-width": 0,
					"min-height": 0
				});
		}
		photoElement.vendorSpecificCss({
			"transform": "translate(-50%, -50%) scale({0}, {0})".format(factor)
		});
	};

	var setLastViewedDate = function(title, url, date, posts, pageIndex, force, nsfw, login_required, auto) {
		var key = getBlogKey(url),
			now = new Date(),
			previousDate = _dates[key],
			previousTime,
			time;

		if (!PEEK) {
			if (date) {
				if (previousDate) {
					if (previousDate.date) {
						previousDate = new Date(previousDate.date);
					} else {
						force = true;
					}
				}
				auto = (auto) ? undefined : {
					"seen": now,
					"seenPosts": posts
				};
				if (previousDate) {
					previousTime = ((previousDate.getTime) ?
						previousDate.getTime() : 0) || 0;
					time = date.getTime() || 0;

					if (force ||
						previousTime < time ||
						(_dates[key].posts !== posts && pageIndex === 0) ||
						!_dates[key].viewed ||
						_dates[key].was_nsfw !== nsfw) {

						return setBlogEntry(url, $.extend({ }, _dates[key], {
							"date": (force || (time > previousTime)) ? date : undefined,
							"login_required": login_required,
							"posts": posts,
							"title": title,
							"viewed": now,
							"was_nsfw": nsfw
						}, auto));
					}
				} else {
					return setBlogEntry(url, $.extend({ }, _dates[key], {
						"date": date,
						"login_required": login_required,
						"posts": posts,
						"title": title,
						"viewed": now,
						"was_nsfw": nsfw
					}, auto));
				}
			} else {
				return setBlogEntry(url);
			}
		}
	};

	var setLinkDownloaded = function(link, post) {
		var requests = [ ];
		$(link).each(function(i, item) {
			var ref = { },
				href = (item = $(item)).attr("href");

			requests.push($.when(isFileDownloaded(href, ref))
				.then(function(downloaded) {
					if (!item.hasClass("downloadProgress")) {
						if (downloaded) {
							item.addClass("downloaded");
							if (ref.download.auto) {
								item.addClass("auto");
							}
						} else {
							item
								.removeClass("downloaded")
								.removeClass("auto");
						}
					}
					/* item[(downloaded &&
						!item.hasClass("downloadProgress")) ?
							"addClass" :
							"removeClass"]("downloaded"); */
					if (post && post.download_url && post.download_url.length) {
						item.attr({
							"title": getDownloadTitle(post, href)
						});
					}
				}));
		});
		$.when.apply(this, requests).then(refreshDownloadsButtons);
	};

	var setPostLoading = function(item, loading) {
		var postElement = $(item).closest(".blogPost"),
			loadingCount = parseInt(postElement.data("loading")) || 0;

		if (loading) {
			if (loadingCount === 0) {
				postElement.addClass("loading");
			}
			postElement.data({
				"loading": ++loadingCount
			});
			postElement.find(".postIndex").find(".loader").button({
				label: loadingCount,
				text: loadingCount > 1
			});
			setDocumentLoading(+1);
		} else {
			postElement.data({
				"loading": --loadingCount
			});
			if (loadingCount === 0) {
				postElement.removeClass("loading");
			} else {
				postElement.find(".postIndex").find(".loader").button({
					label: loadingCount,
					text: loadingCount > 1
				});
			}
			setDocumentLoading(-1);
		}
	};

	var showBlogStatistics = function(info, noReadLater, noShow, showBlogCallback) {
		var blogStatisticsDialog = $(".blogStatisticsDialog"),
			waitFor;

		blogStatisticsDialog
			.find(".field")
			.fadeOut()
			.end()
			.find(".postCount .ui-icon")
			.hide();
		if (!$.isPlainObject(info)) {
			waitFor = $.when(findBlog(info))
				.then(function(newInfo) {
					info = newInfo;
				});
		}
		$.when(waitFor).then(function() {
			var buttons = [{
					"click": function(e) {
						$(this).dialog("close");
					},
					"text": getLocalizedText("ok")
				}],
				isInBlogs = isInMyBlogs(info);

			if (!noShow) {
				buttons.splice(0, 0, {
					"class": "showButton",
					"click": function(e) {
						if (showBlogCallback) {
							showBlogCallback();
						}
						loadBlog(info);
						$(this).dialog("close");
					},
					"text": getLocalizedText("view")
				});
			}
			if (!isInBlogs && !noReadLater && !isInMyReadLater(info.url)) {
				buttons.splice(0, 0, {
					"class": "readLaterButton",
					"click": function(e) {
						addToReadLater(info.url);
					},
					"text": getLocalizedText("later")
				});
			}
			openDialog(blogStatisticsDialog, {
				"buttons": buttons,
				"close": function(e, ui) {
					$($(this).data("requests")).each(function(i, item) {
						item.abort();
					});
				},
				"destroyOnClose": true,
				"dialogClass": "centerButtons",
				"maxHeight": $(window).height() * 0.85,
				"maxWidth": $(window).width() * 0.9,
				"minWidth": $(window).width() * 0.75,
				"open": function(e, ui) {
					var abortable = function(fn, success, failure) {
							var aborted = false;

							return {
								"abort": function() {
									aborted = true;
								},
								"isAborted": function() {
									return aborted;
								},
								"run": function() {
									return $.when($.isFunction(fn) ?
										fn.apply(this, arguments) :
										fn).then(function() {
											if (success && !aborted) {
												success.apply(this, arguments);
											}
										}, function() {
											if (failure) {
												failure.apply(this, arguments);
											}
										});
								}
							};
						},
						abortables = [ ],
						dialog = $(this),
						getInfoResult = $.Deferred(),
						lastViewed = getLastViewedDate(info.url),
						now = $.now(),
						roundValue = function(value, decimals) {
							var rounded = value;

							if (rounded) {
								while (!(rounded = Math.roundTo(value, decimals))) {
									decimals++;
								}
							}
							return rounded;
						},
						setField = function(name, value) {
							var target = name;

							if (typeof target === "string") {
								target = dialog.find(target);
							} else {
								target = $(target);
							}
							if (value !== undefined && value !== null && typeof value !== "string") {
								value = (value.toLocaleString) ?
									value.toLocaleString() :
									value.toString();
							}
							if (value && value.length) {
								target
									.find(".ui-icon")
										.hide()
									.end()
									.closest("tr")
										.show()
									.end()
									.find(".field")
										.html(replaceHTMLNewLines(value))
										.fadeIn();
							} else {
								target
									.closest("tr")
									.hide();
							}
						};

					dialog
						.closest(".ui-dialog")
						.find(".ui-dialog-buttonpane")
						.find(".showButton")
						.button("option", "icons", {
							"primary": (isInBlogs) ?
								"ui-icon-star" :
								"ui-icon-search"
						})
						.end()
						.find(".readLaterButton")
						.button("option", "icons", {
							"primary": "ui-icon-clock"
						});
					dialog
						.find(".postCount .ui-icon")
						.fadeIn();
					dialog
						.find(".url")
						.empty()
						.append(embedLink($(document.createElement("a"))
							.attr({
								"href": info.url
							})
							.text(info.url)));
					if (!isInBlogs) {
						dialog
							.find(".blogDescription")
							.empty()
							.html($(document.createElement("div"))
								.html(sameSource(info.description)).html());
					}
					dialog.find(".label.postType a").each(function(i, item) {
						if (noShow) {
							$(item).attr({
								"href": "#"
							});
						} else {
							$(item).removeAttr("href");
						}
					});

					setField(".forceNSFW", (info.force_nsfw !== undefined) ?
						getLocalizedText((info.force_nsfw) ? "yes" : "no") : undefined);
					setField(".loginRequired", (info.blog.data.login_required !== undefined) ?
						getLocalizedText((info.blog.data.login_required) ? "yes" : "no") : undefined);
					setField(".lastViewedOn", (lastViewed && lastViewed.getTime()) ?
						localizedFormat("two4", lastViewed, getDateIntervalFromNow(now - lastViewed.getTime())) :
						undefined /* getLocalizedText("never") */);
					abortables.push(new abortable(info.blog.getInfo(), function(newInfo) {
						setField(".nsfw", getLocalizedText((newInfo.is_nsfw) ? "yes" : "no"));
						setField(".lastUpdatedOn", localizedFormat("two4", newInfo.updated,
							getDateIntervalFromNow(now - newInfo.updated.getTime())));
						setField(".totalPosts", newInfo.posts);
						getInfoResult.resolve(newInfo);
					}, function() {
						setField(".nsfw", String.empty);
						setField(".lastUpdatedOn", String.empty);
						setField(".totalPosts", String.empty);
						getInfoResult.reject();
					}));
					abortables.push(new abortable(function() {
						return $.Deferred(function(deferred) {
							$.when(getInfoResult).then(function(newInfo) {
								var pageSize = _options.postsPerPage,
									searchForFirstPost,
									startFrom = Math.ceil(newInfo.posts / pageSize);

								(searchForFirstPost = function() {
									info.blog.getPosts(startFrom, undefined, undefined, pageSize)
										.then(function(lastPosts) {
											if (lastPosts.length) {
												var actualPosts = startFrom * pageSize + lastPosts.length;

												if (actualPosts !== newInfo.posts) {
													setField(".totalPosts", localizedFormat("two3",
														newInfo.posts, actualPosts));
												}
												deferred.resolve(newInfo, $(lastPosts).last().get(0));
											} else if (startFrom) {
												startFrom--;
												searchForFirstPost();
											} else {
												deferred.resolve(newInfo);
											}
										}, deferred.reject);
								})();
							}, deferred.reject);
						}).promise();
					}, function(newInfo, firstPost) {
						var days, decimals, difference;

						if (firstPost) {
							decimals = Math.ceil(Math.log(newInfo.posts / 1000) / Math.log(10));
							difference = newInfo.updated.getTime() - firstPost.timestamp.getTime();
							days = Math.floor(difference / (24 * 60 * 60 * 1000));
						}
						setField(".firstPostOn", (firstPost) ?
							localizedFormat("two4", firstPost.timestamp,
								getDateIntervalFromNow(now - firstPost.timestamp.getTime())) :
							String.empty);
						setField(".postsPerDay", (firstPost) ?
							roundValue(newInfo.posts / ((days > 0) ? days : 1), decimals) :
							String.empty);
					}, function() {
						setField(".firstPostOn", String.empty);
						setField(".postsPerDay", String.empty);
					}));
					dialog.find(".postCount").each(function(i, item) {
						var postType = (item = $(item)).data("postType");

						abortables.push(new abortable(function() {
								return $.Deferred(function(deferred) {
									$.when(getInfoResult).then(function(newInfo) {
										var updatedInfo = { };

										return info.blog.getPosts(0, updatedInfo, postType, 1)
											.then(function() {
												deferred.resolve(newInfo, updatedInfo);
											}, deferred.reject);
									}, deferred.reject);
								}).promise();
							}, function(newInfo, updatedInfo) {
								var decimals = Math.ceil(Math.log(newInfo.posts / 1000) / Math.log(10)),
									postsPerType = updatedInfo.posts_per_type[postType];

								setField(item, (newInfo.posts) ?
									localizedFormat("two3", postsPerType, localizedFormat("percent",
										roundValue(postsPerType / newInfo.posts * 100, decimals))) :
									postsPerType);
							}, function() {
								setField(item, String.empty);
							}));
					});
					/* abortables.push(new abortable(info.blog.getFollowers(),
						function(followers) {
							setField(".followers", followers);
						}, function() {
							setField(".followers", String.empty);
						}));
					abortables.push(new abortable(info.blog.getLikes(),
						function(likes) {
							setField(".likes", likes);
						}, function() {
							setField(".likes", String.empty);
						})); */
					dialog.data({
						"requests": abortables
					});
					$(abortables).each(function(i, item) {
						item.run();
					});
				},
				"position": {
					"my": "top",
					"at": "top+{0}".format(Math.ceil($(window).height() * 0.05))
				},
				"title": info.title
			});
		});
	};

	var showBlogsStatus = function(type) {
		var blogs = $("#blogs")
				.find(".blog")
				.filter(function(i, item) {
					item = $(item);

					switch (type) {
						case "new":
							return item.hasClass("newBlog");
						case "read":
							return !item.hasClass("newBlog") &&
								!item.hasClass("oldBlog");
						case "old":
							return item.hasClass("oldBlog");
					}
				}),
			createBlogLink = function(blog) {
				return $(document.createElement("div"))
					.append($(document.createElement("a"))
						.addClass("blogLink")
						.attr({
							"blog": blog.url,
							"href": "#"
						})
						.text(blog.title))
					.html();
			},
			newestUpdatedBlog,
			newestViewedBlog,
			nonZeroFormatWithSpans = function() {
				var arg,
					args = window.argumentsArray(arguments),
					small;

				for (var i = 2; i < args.length; i++) {
					arg = args[i];
					small = false;

					if (!!arg) {
						if (typeof arg === "string") {
							small = !!smallSpans[i];
						} else if (typeof arg === "number") {
							if (arg < 0) {
								arg = localizedFormat("lessThanZero", Math.abs(arg));
							}
						}
						arg = (arg.toLocaleString) ?
							arg.toLocaleString() :
							arg.toString();
						args[i] = $(document.createElement("div"))
							.append($(document.createElement("span"))
								.addClass("data")
								.addClass((small) ?
									"small" :
									undefined)
								.html(arg)).html();
					}
				}
				return localizedFormat.apply(this, args);
			},
			now = $.now(),
			nsfw = 0,
			nsfwHaveLessThanZeroPostsDifference = false,
			nsfwPosts = 0,
			nsfwPostsDifference = 0,
			parameters = [ ],
			posts = 0,
			sfwHaveLessThanZeroPostsDifference = false,
			sfwPosts = 0,
			sfwPostsDifference = 0,
			smallSpan = function() {
				smallSpans[parameters.length] = true;
			},
			smallSpans = [ ],
			title,
			withDifference = [ ];

		if (blogs.length) {
			blogs.each(function(i, item) {
				var info = $(item).data("info"),
					viewed;

				if (info.exists) {
					posts += info.posts;
					if (info.nsfw) {
						nsfwPosts += info.posts;
						nsfw++;
					}
					if (type === "new" || info.postsDifference) {
						if (_options.nsfw || !info.nsfw) {
							withDifference.push(info);
						}
						if (info.postsDifference <= 0) {
							if (info.nsfw) {
								nsfwHaveLessThanZeroPostsDifference = true;
							} else {
								sfwHaveLessThanZeroPostsDifference = true;
							}
						}
						if (info.nsfw) {
							nsfwPostsDifference += Math.max(0, info.postsDifference);
						} else {
							sfwPostsDifference += Math.max(0, info.postsDifference);
						}
					}
					if (!newestUpdatedBlog || (newestUpdatedBlog.updated &&
						newestUpdatedBlog.updated.getTime() < info.updated.getTime())) {
						newestUpdatedBlog = info;
					}
					if (info.viewed) {
						viewed = new Date(info.viewed);
						if (!newestViewedBlog || new Date(newestViewedBlog.viewed).getTime() < viewed.getTime()) {
							newestViewedBlog = info;
						}
					}
				}
			});

			parameters.push((type === "new") ? "newBlogsStatus" : "nonNewBlogsStatus");
			parameters.push(getLocalizedText(type + "BlogsStatusTitle"));
			parameters.push(blogs.length);
			parameters.push(blogs.length - nsfw);
			parameters.push(nsfw);
			if (type === "new") {
				parameters.push((nsfwHaveLessThanZeroPostsDifference || sfwHaveLessThanZeroPostsDifference) ?
					localizedFormat("lessThanZero", nsfwPostsDifference + sfwPostsDifference) :
					nsfwPostsDifference + sfwPostsDifference);
				parameters.push((sfwHaveLessThanZeroPostsDifference) ?
					localizedFormat("lessThanZero", sfwPostsDifference) :
					sfwPostsDifference);
				parameters.push((nsfwHaveLessThanZeroPostsDifference) ?
					localizedFormat("lessThanZero", nsfwPostsDifference) :
					nsfwPostsDifference);
			} else {
				parameters.push(posts);
				parameters.push(posts - nsfwPosts);
				parameters.push(nsfwPosts);
			}
			smallSpan();
			parameters.push(createBlogLink(newestUpdatedBlog));
			parameters.push(newestUpdatedBlog.updated);
			parameters.push(getDateIntervalFromNow(now - newestUpdatedBlog.updated.getTime()));
			if (newestViewedBlog) {
				smallSpan();
				parameters.push(createBlogLink(newestViewedBlog));
				parameters.push(new Date(newestViewedBlog.viewed));
				parameters.push(getDateIntervalFromNow(now - new Date(newestViewedBlog.viewed).getTime()));
			} else {
				smallSpan();
				parameters.push(getLocalizedText("notAvailable"));
				smallSpan();
				parameters.push(getLocalizedText("never"));
				smallSpan();
				parameters.push(getLocalizedText("notAvailable"));
			}
			if (type !== "new") {
				if (withDifference.length) {
					parameters.push(localizedFormat("two3",
						withDifference.length,
						$(withDifference).map(function(i, item) {
							return createBlogLink(item);
						}).get().join(_textTable.dateIntervalOptions.separator)));
				} else {
					parameters.push(0);
				}
			}
			return showStatus(nonZeroFormatWithSpans.apply(this, parameters));
		}
	};

	var showDownloads = function() {
		$.when(hideStatus()).then(function() {
			$(".downloadsProgressDialog").dialog("open");
		});
	};

	var showDownloadsInPage = function(allBlogs) {
		var blogTitle = (allBlogs) ?
				getLocalizedText("downloads") :
				window.sessionStorage.getItem("blogTitle"),
			buttons,
			createDownloadLists = function(links) {
				var bodyElement = $(document.createElement("body")),
					downloadsElement = $(document.createElement("downloads"))
						.attr({
							"folder": "."
						}),
					listElement = $(document.createElement("ol"))
						.appendTo(bodyElement),
					urls = [ ];

				$(links).each(function(i, link) {
					var element = $(link),
						url = element.attr("href");

					if ($.inArray(url, urls) < 0) {
						listElement.append($(document.createElement("li"))
							.addClass("item")
							.append($(document.createElement("a"))
								.addClass("download")
								.addClass(element.hasClass("downloaded") ?
									"downloaded" :
									undefined)
								.addClass((element.closest(".newPost").length) ?
									"new" :
									undefined)
								.attr({
									"href": url,
									"download": element.attr("download"),
									"target": "_blank",
									"title": element.attr("title")
								})
								.text(element.text())));
						downloadsElement
							.append($(document.createElement("download"))
								.attr({
									"url": url,
									"name": element.attr("download"),
									"date": element.data("post").date,
									"downloaded": (element.hasClass("downloaded")) ?
										"downloaded" :
										undefined
								}));
						urls.push(url);
					}
				});
				if (urls.length) {
					urls.push(String.empty);
				}

				downloadsDialogElement
					.closest(".ui-dialog")
					.find(".htmlDownloadButton")
					.attr({
						"download": DOWNLOAD_FILENAME_HTML.format(validateFileName(blogTitle)),
						"href": ("<!doctype html><html><head><style type=\"text/css\">" +
								".item { padding: 0.25em 0; }" +
								".download.new { background-color: lemonChiffon; }" +
								".download.downloaded { color: dimGray; }" +
								"</style></head><body>{0}</body></html>".format(bodyElement.html())).toBase64Data()
					});
				downloadsDialogElement
					.closest(".ui-dialog")
					.find(".textDownloadButton")
					.attr({
						"download": DOWNLOAD_FILENAME_TEXT.format(validateFileName(blogTitle)),
						"href": urls.join(((window.navigator.userAgent.match(/windows/i)) ? "\r" : "") + "\n").toBase64Data()
					});
				downloadsDialogElement
					.closest(".ui-dialog")
					.find(".xmlDownloadButton")
					.attr({
						"download": DOWNLOAD_FILENAME_XML.format(validateFileName(blogTitle)),
						"href": $(document.createElement("div"))
							.append(downloadsElement)
							.html().toBase64Data()
					});
				downloadsDialogElement
					.closest(".ui-dialog")
					.find(".htmlDownloadButton")
					.add(downloadsDialogElement
						.closest(".ui-dialog")
						.find(".textDownloadButton"))
					.add(downloadsDialogElement
						.closest(".ui-dialog")
						.find(".xmlDownloadButton"))
					.button((urls.length) ? "enable" : "disable");
			},
			createLink = function(post) {
				var downloaded = isFileDownloaded(post.post.download_url);

				if (!allBlogs || !downloaded) {
					var listItem = $(document.createElement("li"))
						.appendTo(downloadsElement);

					var downloadInfoButton = createDownloadInfoButton(listItem, post.post);

					if (post.isNewPost) {
						downloadInfoButton.addClass("ui-state-highlight");
					}

					var link = $(document.createElement("a"))
						.addClass("downloadLink")
						.attr({
							"download": post.download,
							"href": post.url,
							"target": "_blank",
							"title": post.title
						})
						.data("post", post.post)
						.append((post.isNewPost) ? newImage() : undefined)
						.append($(document.createTextNode(post.text)))
						.on({
							"click": function(e) {
								var clickedLink = $(e.target)
									.closest("a"),
									post = clickedLink.data("post");

								if (_options.nativeDownload) {
									setFileDownloaded(clickedLink.attr("href"), post);
								} else {
									e.preventDefault();
									_downloadManager.downloadPost(post);
								}
							}
						})
						.appendTo($(document.createElement("span"))
							.addClass("ui-corner-all")
							.addClass((post.isNewPost) ?
									"newPost" :
									undefined)
							.data({
								"post": post
							})
							.appendTo(listItem));
					listItem
						.find(".setDownload")[(downloaded) ?
							"removeClass" :
							"addClass"]("downloaded");
					listItem
						.find(".resetDownload")[(downloaded) ?
							"addClass" :
							"removeClass"]("downloaded");
					setLinkDownloaded(link.add(downloadInfoButton), post.post);
					return listItem;
				}
			},
			createPageLabel = function(pageIndex, downloadsCount) {
				if (downloadsCount || !allBlogs) {
					$(document.createElement("div"))
						.addClass("pageLabel")
						.text(localizedFormat((downloadsCount) ?
							"downloadsInPage" : "noDownloadsInPage",
								pageIndex + 1, downloadsCount))
						.appendTo(downloadsElement);
					if (downloadsCount) {
						$(document.createElement("hr"))
							.addClass("pageLine")
							.appendTo(downloadsElement);
					}
				}
			},
			downloadsDialogElement = $(".downloadsDialog"),
			downloadsListElement = downloadsDialogElement
				.find(".downloadList").empty(),
			downloadsElement = $(document.createElement("ol"))
				.appendTo(downloadsListElement),
			downloads = $("#blogPage").find(".downloadButton"),
			firstPage = [ ],
			getLoaderMaximum = function(blogInfo, pageIndex) {
			},
			info = $(".pageOptionsDialog").data("info"),
			last,
			listDownloads = function(items, addLabel, pageIndex) {
				var allPosts = allBlogs,
					hasLink,
					oldies = [ ];

				if (addLabel) {
					createPageLabel(pageIndex, items.length);
				}
				$(items).each(function(i, item) {
					if (i === 0 && !item.isNewPost) {
						allPosts = true;
					}
					if (!addLabel || item.isNewPost || allPosts) {
						if (createLink(item)) {
							hasLink = true;
						}
					} else {
						oldies.push(item);
					}
				});
				if (addLabel && !hasLink) {
					if (items.length || !allBlogs) {
						downloadsElement.find(".pageLine").last().remove();
						downloadsElement.find(".pageLabel").last().remove();
					}
					if (!allBlogs) {
						createPageLabel(pageIndex, 0);
					}
				}
				if (oldies.length) {
					downloadsDialogElement.data({
						"oldies": oldies
					});
					$(oldies).each(function(i, item) {
						if (!item.isDownloaded) {
							window.setTimeout(function() {
								nextDownloadsButton.trigger("click");
							}, DEFAULT_TIMEOUT);
							return false;
						}
					});
				} else {
					downloadsDialogElement.removeData("oldies");
				}
				nextDownloadsButton.button("option", "label",
					localizedFormat((oldies.length) ?
						"more2" : "more", oldies.length));
				if (pageIndex) {
					scrollListToBottom();
				}
				createDownloadLists(downloadsListElement.find("a.downloadLink"));
				if (downloadsDialogElement.data("ui-dialog")) {
					downloadsDialogElement.dialog("option", "position", "center");
				}
			},
			loaded = false,
			nextDownloadsButton = downloadsDialogElement
				.find(".nextDownloads")[(allBlogs) ? "hide" : "fadeIn"](),
			searchPage = function(blogInfo, pageIndex, updatedTime, startedFromNew, nextBlog, result) {
				var oldies = downloadsDialogElement.data("oldies");

				result = result || $.Deferred();
				if (oldies) {
					listDownloads(oldies);
					result.resolve();
				} else {
					return window.loading(function() {
						var allBlogsNoNewPost = function() {
							var count = downloadsElement.find("li").length;

							if (!count) {
								downloadsElement.closest("li").remove();
							}
							if (nextBlog && (blogInfo = nextBlog(count))) {
								searchPage(blogInfo, -1, getLastUpdatedDate(blogInfo.url,
									true).getTime(), true, nextBlog, result);
							} else {
								result.resolve();
							}
						};

						if (allBlogs) {
							window.loader.value(blogInfo.loaderStart + Math.min(blogInfo.loaderStep,
								(pageIndex + 2) * blogInfo.loaderStep / blogInfo.newPages));
						} else {
							window.loader.value(pageIndex + 2);
						}
						return $.when(blogInfo.blog.getPosts(pageIndex + 1, undefined, undefined,
							_options.postsPerPage, window.sessionStorage.getItem("blogTag")))
							.then(function(posts) {
								var newPosts = 0,
									pinCount = 0;

								posts = $(posts).filter(function(i, post) {
									if (post.is_pinned) {
										pinCount++;
										return false;
									}
									return true;
								});
								if (posts.length) {
									if (!window.loader.isCanceled()) {
										listDownloads(posts.each(function(i, post) {
											if (post.isNewPost = new Date(post.date).getTime() > updatedTime) {
												newPosts++;
											}
										}).filter(function(i, post) {
											return post.download_url &&
												post.download_url.length;
										}).map(function(i, post) {
											return {
												"download": getDownloadFileName(post),
												/* "isDownloaded": isFileDownloaded(post.download_url), */
												"isNewPost": post.isNewPost,
												"post": post,
												"text": getDownloadText(post),
												"title": getDownloadTitle(post),
												"url": post.download_url
											};
										}), true, ++pageIndex);
										if (!allBlogs) {
											nextDownloadsButton.data({
												"pageIndex": pageIndex
											});
										}
										if (posts.length + pinCount === _options.postsPerPage &&
											(newPosts === posts.length ||
											(newPosts === 0 && !startedFromNew))) {

											searchPage(blogInfo, pageIndex, updatedTime, startedFromNew, nextBlog, result);
										} else if (allBlogs) {
											allBlogsNoNewPost();
										} else {
											result.resolve();
										}
									}
								} else if (allBlogs) {
									allBlogsNoNewPost();
								} else {
									nextDownloadsButton.fadeOut();
									result.resolve();
								}
							});
					}, (allBlogs) ?
						localizedFormat("searchingInPage3", blogInfo.title,
							blogInfo.scanIndex, blogInfo.scanTotal, pageIndex + 2, blogInfo.newPages) :
						localizedFormat(((blogInfo.newPages > 0 && pageIndex < blogInfo.newPages - 1) || true) ?
							"searchingInPage2" :
							"searchingInPage",
							pageIndex + 2, (blogInfo.newPages > 0 && pageIndex < blogInfo.newPages - 1) ?
								blogInfo.newPages :
								Math.ceil(blogInfo.total_posts / _options.postsPerPage)));
				}
				return result;
			},
			scrollListToBottom = function() {
				downloadsDialogElement.scrollTop(downloadsListElement[0].scrollHeight);
			};

		downloads.each(function(i, item) {
			var post = $(item).children().first();

			firstPage.push({
				"download": post.attr("download"),
				/* "isDownloaded": post.hasClass("downloaded"), */
				"isNewPost": post
					.closest(".blogPost")
					.hasClass("newPost"),
				"post": post.data("post"),
				"text": post.data("downloadText"),
				"title": post.attr("title"),
				"url": post.attr("href")
			});
		});

		if (!allBlogs) {
			nextDownloadsButton.off().data({
				"pageIndex": info.blog.page
			}).on({
				"click": function(e) {
					var pageIndex = parseInt(nextDownloadsButton.data("pageIndex")),
						fromNew = info.newPages > 0 && pageIndex < info.newPages - 1;

					loaded = true;
					window.loader.maximum((fromNew) ?
						info.newPages :
						Math.ceil(info.total_posts / _options.postsPerPage));
					window.loader.value(0);
					searchPage(info, pageIndex, getLastUpdatedDate(info.url, true).getTime(), fromNew);
				}
			});
		}
		buttons = [{
			"class": "htmlDownloadButton",
			"click": function(e) { }
		}, {
			"class": "textDownloadButton",
			"click": function(e) { }
		}, {
			"class": "xmlDownloadButton",
			"click": function(e) { }
		}, {
			"class": "downloads2",
			"click": showDownloads,
			"text": "."
		}];
		if (allBlogs) {
			downloadsDialogElement
				.closest(".ui-dialog")
				.find(".htmlDownloadButton")
				.add(downloadsDialogElement
					.closest(".ui-dialog")
					.find(".textDownloadButton"))
				.add(downloadsDialogElement
					.closest(".ui-dialog")
					.find(".xmlDownloadButton"))
				.button("disable");
			buttons.push({
				"class": "searchButton",
				"click": function(e) {
					var blogIndex = 0,
						blogListElement = $(document.createElement("ul"))
							.appendTo(downloadsListElement.empty()),
						last = 0,
						loaderMaximum = 1e9,
						nsfwOnly = !!downloadsDialogElement
							.closest(".ui-dialog")
							.find(".nsfwOnly")
							.prop("checked"),
						newBlogs = $.map(_infos, function(item) {
							return (item.exists && item.isNew && (!nsfwOnly || item.nsfw)) ?
								item :
								undefined;
						}),
						startBlog = function(blogInfo) {
							blogInfo.newPages = Math.ceil(blogInfo.postsDifference / _options.postsPerPage);
							blogInfo.scanIndex = blogIndex + 1;
							blogInfo.scanTotal = newBlogs.length;
							$(document.createElement("li"))
								.text(blogInfo.title)
								.append(downloadsElement = $(document.createElement("ol"))
									.attr({
										"start": last + 1
									}))
								.appendTo(downloadsListElement)
							scrollListToBottom();
							blogInfo.loaderStart = (blogInfo.loaderStep = step) * blogIndex;
						},
						step = loaderMaximum / newBlogs.length;

					if (newBlogs.length) {
						window.loader.value(0);
						window.loader.maximum(loaderMaximum);
						startBlog(newBlogs[blogIndex]);
						searchPage(newBlogs[blogIndex], -1, getLastUpdatedDate(newBlogs[blogIndex].url,
							true).getTime(), true, function(count) {
								var blogInfo = newBlogs[++blogIndex];

								last += count;
								if (blogInfo) {
									startBlog(blogInfo);
								}
								return blogInfo;
							});
					}
				},
				"text": "."
			});
		}
		buttons.push({
			"click": function(e) {
				$(this).dialog("close");
			},
			"text": getLocalizedText("ok")
		});
		openDialog(downloadsDialogElement, {
			"beforeClose": function(e, ui) {
				var nsfwOnly;

				if (allBlogs) {
					if ((nsfwOnly = downloadsDialogElement
						.closest(".ui-dialog")
						.find(".nsfwOnly")
						.prop("checked")) !== _options.searchNSFWOnly) {

						_options.searchNSFWOnly = nsfwOnly;
						saveOptions();
					}
				}
			},
			"buttons": buttons,
			"close": function(e, ui) {
				window.loader.cancelable(false);
				keepAlive(false);
			},
			"create": function() {
				$(this).css("maxWidth", $(window).width() * 0.85);
			},
			"destroyOnClose": true,
			"dontCloseOnBackdropClick": function() {
				return allBlogs || loaded;
			},
			"maxHeight": $(window).height() * 0.8,
			"minHeight": $(window).height() * 0.65,
			"minWidth": $(window).width() * 0.5,
			"open": function(e, ui) {
				var button;

				button = downloadsDialogElement
					.closest(".ui-dialog")
					.find(".htmlDownloadButton")
					.empty();
				button
					.append($(document.createElement("a"))	/* 'A' button: OK */
						.addClass("htmlDownloadButton")
						.attr({
							"href": "#"
						})
						.button({
							"icons": {
								"primary": "ui-icon-document"
							},
							"label": getLocalizedText("downloadAsHTML"),
							"text": false
						}))
					.appendTo(button.parent().parent());

				button = downloadsDialogElement
					.closest(".ui-dialog")
					.find(".textDownloadButton")
					.empty();
				button
					.append($(document.createElement("a"))	/* 'A' button: OK */
						.addClass("textDownloadButton")
						.attr({
							"href": "#"
						})
						.button({
							"icons": {
								"primary": "ui-icon-script"
							},
							"label": getLocalizedText("downloadAsText"),
							"text": false
						}))
					.appendTo(button.parent().parent());

				button = downloadsDialogElement
					.closest(".ui-dialog")
					.find(".xmlDownloadButton")
					.empty();
				button
					.append($(document.createElement("a"))	/* 'A' button: OK */
						.addClass("xmlDownloadButton")
						.attr({
							"href": "#"
						})
						.button({
							"icons": {
								"primary": "ui-icon-transferthick-e-w"
							},
							"label": getLocalizedText("downloadAsXml"),
							"text": false
						}))
					.appendTo(button.parent().parent());

				button = downloadsDialogElement
					.closest(".ui-dialog")
					.find(".searchButton")
					.button({
						"icons": {
							"primary": "ui-icon-search"
						},
						"label": getLocalizedText("findDownloads"),
						"text": false
					});

				downloadsDialogElement
					.closest(".ui-dialog")
					.find(".downloads2")
					.removeClass("ui-button-text-only")
					.removeClass("ui-button-text-icon-primary")
					.addClass("ui-button-icon-only")
					.addClass("ui-button-icon-primary");

				refreshDownloadsButtons();
				if (allBlogs) {
					downloadsDialogElement
						.closest(".ui-dialog")
						.find(".ui-dialog-buttonpane")
						.children()
						.first()
						.before($(document.createElement("div"))
							.append($(document.createElement("label"))
								.addClass("downloadsDialogNSFWOnly")
								.append($(document.createElement("input"))
									.addClass("nsfwOnly")
									.attr({
										"type": "checkbox"
									})
									.prop("checked", _options.searchNSFWOnly))
								.append(document.createTextNode(getLocalizedText("nsfwOnly")))));
				} else {
					listDownloads(firstPage, true, info.blog.page);
				}
				window.loader.cancelable(true);
				window.loader.value(false);
				keepAlive(true);
			},
			"position": {
				"my": "top",
				"at": "top+{0}".format(Math.ceil($(window).height() * 0.05))
			}
		});
	};

	var showFullScreen = function(post, photoIndex, slideshow, imageSize) {
		var blogURL = window.sessionStorage.getItem("blog"),
			canGoFullScreen,
			changed = false,
			downloadURL = post.download_url,
			i,
			isOriginalPhoto,
			isPhoto,
			mediaElement,
			name,
			newPosts = 0,
			newVideo,
			originalMediaAudio,
			originalSize,
			originalMediaTime,
			pageWidth = (window.devicePixelRatio === 1) ?
				screen.width :
				$(window).width(),
			pageHeight = (window.devicePixelRatio === 1) ?
				screen.height :
				$(window).height(),
			postIndex,
			posts = $("#blogPage").data("posts"),
			selectedPhoto,
			shouldPlayMedia,
			slidePosts,
			videoSource;

		imageSize = imageSize || getImageSize(blogURL);

		var fullScreenContainerElement = $(".fullScreenContainer"),
			audioElement = fullScreenContainerElement
				.find(".fullScreen")
				.find("audio").hide(),
			imageElement = fullScreenContainerElement
				.find(".fullScreen")
				.find("img").hide(),
			videoElement = fullScreenContainerElement
				.find(".fullScreen")
				.find(".video").hide();

		$("#blogPage").find("video").each(function(i, item) {
			if ($(item)
				.closest(".blogPost")
				.attr("postID") == post.id) {

				originalMediaTime = item.currentTime;
			}
			if (item.currentTime > 0 &&
				!item.paused &&
				!item.ended &&
				item.readyState > 2) {

				if ($(item)
					.closest(".blogPost")
					.attr("postID") == post.id) {

					shouldPlayMedia = true;
				}
				item.pause();
			}
			if (!item.muted) {
				originalMediaAudio = item.volume;
			}
		});

		var noVideo = function() {
			videoElement.off()
				.remove();
		}

		$(slidePosts = $(posts).filter(function(j, item) {
			return isSlidePost(item);
		})).each(function(j, item) {
			if (item.isNewPost) {
				newPosts++;
			}
			if (item === post) {
				postIndex = j;
			}
		});

		if (isPhoto = (typeof photoIndex !== "undefined" && (post.type === "photo" || (post.photos && post.photos.length)))) {
			originalSize = post.photos[photoIndex].original_size;
			selectedPhoto = chooseImage(imageSize, post, photoIndex,
				pageWidth, pageHeight, true);
		}

		fullScreenContainerElement
			.data({
				"photoIndex": photoIndex,
				"post": post
			});

		fullScreenContainerElement
			.find(".previousPost")
			.button((postIndex > 0) ? "enable" : "disable");
		fullScreenContainerElement
			.find(".previous")
			.button((postIndex > 0 ||
				(post.photos && photoIndex > 0)) ?
					"enable" :
					"disable");
		fullScreenContainerElement
			.find(".slideshowInfo")
			.html($(document.createElement("div"))
				.append((post.isNewPost) ?
					$(document.createElement("div"))
						.append(newImage()) :
					undefined)
				.append((post.photos && post.photos.length > 1) ?
					localizedFormat("two", photoIndex + 1, post.photos.length) :
					(post.durationText && post.durationText.length) ?
						post.durationText :
						undefined)
				.append(((post.photos && post.photos.length > 1) ||
					(post.durationText && post.durationText.length)) ?
					$(document.createElement("br")) :
					undefined)
				.append((newPosts && post.isNewPost) ?
					localizedFormat("three", postIndex + 1, newPosts, slidePosts.length) :
					localizedFormat("two", postIndex + 1, slidePosts.length))
				.html());
		fullScreenContainerElement
			.find(".next")
			.button((postIndex < slidePosts.length - 1 ||
				(post.photos && photoIndex < post.photos.length - 1)) ?
					"enable" :
					"disable");
		fullScreenContainerElement
			.find(".nextPost")
			.button((postIndex < slidePosts.length - 1) ? "enable" : "disable");

		if (isPhoto) {
			setFullScreenZoom(false);
			changed = imageElement.hasClass("ui-state-error") ||
				selectedPhoto.url !== imageElement.attr("src");
			canGoFullScreen = !! getRequestFullScreen(imageElement[0]);
			downloadURL = post.photos[photoIndex].download_url;
			noVideo();
		} else {
			switch (post.type) {
				case "audio":
					changed = (mediaElement = audioElement.hasClass("ui-state-error")) ||
						post.audio_url !== audioElement.attr("src");
					canGoFullScreen = !!getRequestFullScreen(mediaElement[0]);
					noVideo();
					break;
				case "video":
					mediaElement = newVideo = chooseVideoPlayer(imageSize, post,
						pageWidth, pageHeight, true);

					if (newVideo.length) {
						videoSource = newVideo.find("[has-src]");

						if (newVideo.attr("has-src") !== undefined) {
							videoSource = videoSource.add(newVideo);
						}
						videoSource.removeAttr("has-src")
							.each(function(i, item) {
								(item = $(item))
									.attr({
										"src": item.data("src")
									})
									.removeData("src");
							});
						canGoFullScreen = !!getRequestFullScreen(mediaElement[0]);
					}

					changed = videoElement.length === 0 ||
						videoElement.length !== newVideo.length ||
						videoElement.attr("id") !== newVideo.attr("id") ||
						videoElement.attr("src") !== newVideo.attr("src");
					break;
			}
		}

		if (canGoFullScreen && _options.enableFullScreenViewerFullScreen) {
			fullScreenContainerElement
				.find(".fullScreenFullScreen")
				.fadeIn()
				.data({
					"mediaElement": (((isPhoto) ?
						imageElement :
						mediaElement) || [ ])[0]
				});
		} else {
			fullScreenContainerElement
				.find(".fullScreenFullScreen")
				.fadeOut();
		}
		if (_options.enableImageSearch &&
			isPhoto &&
			downloadURL &&
			downloadURL.length) {

			fullScreenContainerElement
				.find(".imageSearch")
				.fadeIn()
				.each(function(i, item) {
					$(item).attr({
						"href": $(item).data("imagesearchurl")
							.format(window.encodeURIComponent(downloadURL)),
						"target": "_blank"
					});
				});
		} else {
			fullScreenContainerElement
				.find(".imageSearch")
				.fadeOut();
		}
		if (changed) {
			audioElement
				.add(imageElement)
				.add(videoElement)
				.off()
				.empty()
				.attr({
					"alt": String.empty,
					"src": String.empty,
					"title": String.empty
				});

			bindMediaLoading(imageElement);
			if (mediaElement) {
				if (originalMediaTime || originalMediaAudio) {
					(function() {
						var handler;

						handler = function(e) {
							this.removeEventListener("canplay", handler);
							if (shouldPlayMedia && originalMediaTime) {
								try {
									this.currentTime = originalMediaTime;
								} catch (ex) { }
							}
							if (originalMediaAudio) {
								try {
									this.muted = false;
								} catch (ex) { }
								try {
									this.volume = originalMediaAudio;
								} catch (ex) { }
							}
						};
						mediaElement[0].addEventListener("canplay", handler);
					})();
				}
				if (shouldPlayMedia) {
					try {
						mediaElement[0].play();
					} catch (e) { }
				}
			}
			if (downloadURL && downloadURL.length) {
				setLinkDownloaded(fullScreenContainerElement
					.find(".fullScreenDownload")
					.button("option", "icons", {
						"primary": (_options.nativeDownload) ?
							"ui-icon-arrowthickstop-1-s" :
							"ui-icon-extlink"
					})
					.attr({
						"download": name = getDownloadFileName(post, downloadURL),
						"href": downloadURL,
						"target": "_blank",
						"title": getDownloadTitle(post, downloadURL)
					})
					.fadeIn(), post);
			} else {
				fullScreenContainerElement
					.find(".fullScreenDownload")
					.fadeOut();
			}
			if (isPhoto) {
				isOriginalPhoto = (selectedPhoto.width === originalSize.width &&
					selectedPhoto.height === originalSize.height);
				fullScreenContainerElement
					.find(".fullScreenImageSize")
					.off()
					.show()
					.text((isOriginalPhoto) ?
							localizedFormat("size", selectedPhoto.width,
								selectedPhoto.height) :
							localizedFormat("two",
								localizedFormat("size", selectedPhoto.width,
								selectedPhoto.height),
								localizedFormat("size", originalSize.width,
									originalSize.height)))
					[(isOriginalPhoto) ? "removeClass" : "addClass"]("clickable");
				if (post.photos[photoIndex].alt_sizes.length > 1 &&
					(isOriginalPhoto || $.isPlainObject(imageSize))) {

					fullScreenContainerElement
						.find(".fullScreenImageSize")
						.addClass("clickable")
						.on({
							"click": function(e) {
								fullScreenContainerElement
									.find(".fullScreenImageSizeList")
									.slideDown();
								e.stopPropagation();
							},
							"touchend": function(e) {
								window.clearTimeout(t);
							},
							"touchstart": function(e) {
								t = window.setTimeout(function() {
									fullScreenContainerElement
										.find(".fullScreenImageSizeList")
										.slideDown();
								}, 500);
							}
						});
					(function() {
						var sizes = post.photos[photoIndex].alt_sizes.slice(0);

						sizes.sort(function(a, b) {
							a = a.width * a.height;
							b = b.width * b.height;

							return (a < b) ? -1 : (a > b) ? 1 : 0;
						});
						fullScreenContainerElement
							.find(".fullScreenImageSizeList")
							.remove();
						$(document.createElement("div"))
							.addClass("fullScreenImageSizeList")
							.addClass("fullScreenButton")
							.append($.map(sizes, function(size, i) {
								return $(document.createElement("div")).css("display", "table-row").append($(document.createElement("div"))
									.addClass("sizeItem")
									.addClass((i === 0) ?
										"ui-corner-top first" :
										(i === sizes.length - 1) ?
											"ui-corner-bottom" :
											undefined)
									.addClass("ui-widget-content")
									.data({
										"size": size
									})
									.text(localizedFormat("size", size.width, size.height))
									.on({
										"click": function(e) {
											showFullScreen(post, photoIndex, slideshow, size);
										}
									}));
							}))
							.appendTo(fullScreenContainerElement);
					})();
				} else if (!isOriginalPhoto) {
					fullScreenContainerElement
						.find(".fullScreenImageSize")
						.on({
							"click": function(e) {
								showFullScreen(post, photoIndex, slideshow, "best");
							}
						});
				}
				imageElement
					.show()
					.attr({
						"alt": selectedPhoto.url
					})
					.data({
						"photo": selectedPhoto,
						"src": selectedPhoto.url
					});

				if (slideshow) {
					startLoadingImage(imageElement, true);
				}
			} else {
				switch (post.type) {
					case "audio":
						fullScreenContainerElement
							.find(".fullScreenImageSize")
							.off()
							.hide();
						audioElement
							.show()
							.attr({
								"src": post.audio_url
							});
						break;
					case "video":
						fullScreenContainerElement
							.find(".fullScreenImageSize")
							.off()
							.hide();

						if (videoElement.length > 0) {
							videoElement
								.off()
								.remove();
						}
						videoElement = newVideo
							.appendTo(audioElement.parent())
							[(imageSize === "micro") ?
								"addClass" :
								"removeClass"]("micro")
							.show();
						bindVideo(videoElement);
						bindMediaLoading(videoElement);
						((videoElement.is("video") && _options.customVideoControls) ?
							videoElement.parent() :
							videoElement)
							.addClass("video");
						break;
				}
			}
		} else if (isPhoto) {
			imageElement.show();
		} else {
			switch (post.type) {
				case "audio":
					audioElement.show();
					break;
				case "video":
					videoElement.show();
					break;
			}
		}
		if (slideshow) {
			scrollToPost(post, photoIndex);
		} else {
			if (isPhoto) {
				window.setTimeout(function() {
					startLoadingImage(imageElement, true);
				});
			}
			fullScreenContainerElement.fadeIn();
		}
	};

	var showLink = function(url, title, embedded) {
		var currentWindow = $(window),
			windowFactor = 0.95;

		if (embedded || _options.embedLinks) {
			openDialog($(".embeddedLinkDialog"), {
				"close": function(e, ui) {
					$(e.target)
						.find("iframe")
						.first()
						.attr({
							"src": BLANK_PAGE
						});
				},
				"draggable": false,
				"height": currentWindow.height() * windowFactor,
				"maxHeight": currentWindow.height() * windowFactor,
				"maxWidth": currentWindow.width() * windowFactor,
				"minHeight": currentWindow.height() * windowFactor,
				"minWidth": currentWindow.width() * windowFactor,
				"open": function(e, ui) {
					$(e.target)
						.closest(".ui-dialog")
						.find(".ui-dialog-title")
						.empty()
						.append($(document.createElement("a"))
							.attr({
								"href": url,
								"target": "_blank",
								"title": url
							})
							.text(title || url));
					$(e.target)
						.find("iframe")
						.one({
							"load": function(e2) {
								var iFrameDocument = e2.target.document ||
									e2.target.contentDocument;

								$(iFrameDocument.body).css({
									"background-color": "whitesmoke",
									"text-align": "center"
								});
								$(iFrameDocument.createElement("div"))
									.text(localizedFormat("embeddedIFrameText"))
									.appendTo(iFrameDocument.body);
								$(iFrameDocument.createElement("br"))
									.appendTo(iFrameDocument.body);
								$(iFrameDocument.createElement("a"))
									.attr({
										"href": url,
										"target": "_blank"
									})
									.text(url)
									.appendTo(iFrameDocument.body);
								iFrameDocument.location.href = url;
							}
						})
						.attr({
							"src": BLANK_PAGE
						});
				},
				"width": currentWindow.width() * windowFactor
			});
		} else {
			window.open(url);
		}
	};

	var showNewBlogsStatus = function(clickCallback) {
		var allHaveLessThanZeroPostsDifference = false,
			allNewBlogs = 0,
			allNewPosts = 0,
			blogsElement = $("#blogs"),
			hasLessThanZeroPostsDifference = false,
			i,
			j,
			lastViewedDate,
			lessThanZero1 = false,
			lessThanZero2 = false,
			messageElement = $(document.createElement("div")),
			newBlogsData = blogsElement.find(".newBlogsHeader").data(),
			newBlogs = 0,
			newPosts = 0,
			nsfwVisible = _options.nsfw,
			sfwHaveLessThanZeroPostsDifference = false,
			sfwNewBlogs = 0,
			sfwNewPosts = 0,
			text,
			text2;

		if (blogsElement.find(".blog").length) {
			if (newBlogsData) {
				allHaveLessThanZeroPostsDifference = newBlogsData.allHaveLessThanZeroPostsDifference;
				allNewBlogs = newBlogsData.allNewBlogs;
				allNewPosts = newBlogsData.allNewPosts;
				hasLessThanZeroPostsDifference = newBlogsData.hasLessThanZeroPostsDifference;
				newBlogs = newBlogsData.length;
				newPosts = newBlogsData.newPosts;
				sfwNewBlogs = newBlogsData.sfwNewBlogs;
				sfwNewPosts = newBlogsData.sfwNewPosts;
				sfwHaveLessThanZeroPostsDifference = newBlogsData.sfwHaveLessThanZeroPostsDifference;
			}
			text = (newBlogs || newPosts) ?
				((nsfwVisible) ? sfwNewBlogs !== allNewBlogs : newBlogs !== allNewBlogs) ?
					text = String.format(getLocalizedText("two3"),
						(nsfwVisible) ? allNewBlogs : newBlogs,
						(nsfwVisible) ? sfwNewBlogs : allNewBlogs) :
					newBlogs.toLocaleString() :
				getLocalizedText("noNewPost");
			if (newBlogs || newPosts) {
				if ((nsfwVisible) ? sfwNewPosts !== allNewPosts : newPosts !== allNewPosts) {
					i = (nsfwVisible) ? allNewPosts : newPosts;
					j = (nsfwVisible) ? sfwNewPosts : allNewPosts;
					lessThanZero1 = (nsfwVisible) ?
						allHaveLessThanZeroPostsDifference :
						hasLessThanZeroPostsDifference;
					lessThanZero2 = (nsfwVisible) ?
						sfwHaveLessThanZeroPostsDifference :
						allHaveLessThanZeroPostsDifference;
				} else {
					lessThanZero1 = lessThanZero2 = hasLessThanZeroPostsDifference;
					i = j = newPosts;
				}
				text2 = (lessThanZero1) ?
					localizedFormat("lessThanZero", i) :
					i.toLocaleString();
				if  (i !== j) {
					text2 = String.format(getLocalizedText("two3"), text2, (lessThanZero2) ?
						localizedFormat("lessThanZero", j) :
						j.toLocaleString());
				}
				messageElement
					.append(String.format(replaceHTMLNewLines(getLocalizedText("newBlogs")),
						$(document.createElement("div"))
							.append($(document.createElement("span"))
								.addClass("data")
								.text(text))
							.html(),
						$(document.createElement("div"))
							.append($(document.createElement("span"))
								.addClass("data")
								.text(text2))
							.html()));
			} else {
				messageElement.append($(document.createTextNode(text)));
			}
			if ((lastViewedDate = blogsElement.data("lastViewedDate")) && lastViewedDate.getTime()) {
				var interval = $.now() - lastViewedDate.getTime();

				if (!window.sessionStorage.getItem("loaded") || interval >= IDLE_INTERVAL) {
					messageElement
						.append($(document.createElement("br")))
						.append(localizedFormat("lastViewed",
							$(document.createElement("div"))
							.append($(document.createElement("span"))
								.addClass("data")
								.text(getDateInterval(interval)))
								.html()));
				}
			}
			return showStatus(messageElement.html(), undefined, function(e) {
				if (clickCallback) {
					clickCallback($.extend({ }, e, {
						"newBlogs": newBlogs,
						"newPosts": newPosts
					}));
				}
			});
		}
	}

	var showOptions = function() {
		var themeElement = $("#options_theme"),
			avatarSizeElement = $("#options_avatarSize"),
			postTypeElement = $("#options_postType"),
			postsPerPageElement = $("#options_postsPerPage"),
			imageSizeElement = $(".optionsDialog").find("[name=options_imageSize]"),
			downloadSynchronizationElement = $(".optionsDialog").find("[name=options_downloadSynchronization]");

		var collectOptions = function() {
			return $.extend({ }, _options, {
				  "avatarSize": parseInt(avatarSizeElement.val())
				, "postType": postTypeElement.val()
				, "postsPerPage": parseInt(postsPerPageElement.val())
				, "imageSize": imageSizeElement.filter(":checked").val()
				, "downloadSynchronization": downloadSynchronizationElement.filter(":checked").val()
				, "showMissingDownloads": $("#options_showMissingDownloads").prop("checked")
				, "preloadImages": $("#options_preloadImages").prop("checked")
				, "customVideoControls": $("#options_customVideoControls").prop("checked")
				, "customGifControls": $("#options_customGifControls").prop("checked")
				, "enableFullScreenViewer": $("#options_fullScreenViewer").prop("checked")
				, "enableFullScreenViewerFullScreen": $("#options_fullScreenViewerFullScreen").prop("checked")
				, "showTags": $("#options_showTags").prop("checked")
				, "showAllImageSizes": $("#options_showAllImageSizes").prop("checked")
				, "showNotes": $("#options_showNotes").prop("checked")
				, "sortByPosts": $("#options_sortByPosts").prop("checked")
				, "embedLinks": $("#options_embedLinks").prop("checked")
				, "embedVideos": $("#options_embedVideos").prop("checked")
				, "enableImageSearch": $("#options_enableImageSearch").prop("checked")
				, "peekMode": $("#options_peekMode").prop("checked")
				, "nsfw": $("#options_nsfw").prop("checked")
				, "vibrateOnCheckCompletion": $("#options_vibrateOnCheckCompletion").prop("checked")
				, "autoUpdatePostCountMismatches": $("#options_autoUpdatePostCountMismatches").prop("checked")
				, "hideOldies": $("#options_hideOldies").prop("checked")
				, "nativeDownload": $("#options_nativeDownload").prop("checked")
			});
		};

		var refreshOptions = function(options) {
			themeElement
				.val(options.theme);
			avatarSizeElement
				.val(options.avatarSize);
			postTypeElement
				.val(options.postType);
			postsPerPageElement
				.val(options.postsPerPage);
			imageSizeElement.val([ options.imageSize ]);
			downloadSynchronizationElement.val([ options.downloadSynchronization ]);
			$("#options_showMissingDownloads").prop("checked", options.showMissingDownloads);
			$("#options_preloadImages").prop("checked", options.preloadImages);
			$("#options_customVideoControls").prop("checked", options.customVideoControls);
			$("#options_customGifControls").prop("checked", options.customGifControls);
			$("#options_fullScreenViewer").prop("checked", options.enableFullScreenViewer);
			$("#options_fullScreenViewerFullScreen").prop("checked", options.enableFullScreenViewerFullScreen);
			$("#options_showTags").prop("checked", options.showTags);
			$("#options_showAllImageSizes").prop("checked", options.showAllImageSizes);
			$("#options_showNotes").prop("checked", options.showNotes);
			$("#options_sortByPosts").prop("checked", options.sortByPosts);
			$("#options_embedLinks").prop("checked", options.embedLinks);
			$("#options_embedVideos").prop("checked", options.embedVideos);
			$("#options_enableImageSearch").prop("checked", options.enableImageSearch);
			$("#options_peekMode").prop("checked", options.peekMode);
			$("#options_nsfw").prop("checked", options.nsfw);
			$("#options_vibrateOnCheckCompletion").prop("checked", options.vibrateOnCheckCompletion)
				.prop("disabled", !window.navigator.vibrate);
			$("#options_autoUpdatePostCountMismatches").prop("checked", options.autoUpdatePostCountMismatches);
			$("#options_hideOldies").prop("checked", options.hideOldies);
			$("#options_nativeDownload").prop("checked", options.nativeDownload);

			$("#options_nsfw").parent().add($("#options_nsfw").parent().prev())[(OFFICE_MODE !== 2) ? "show" : "hide"]();
		};

		var refreshSelectMenus = function() {
			themeElement
				.selectmenu("refresh");
			avatarSizeElement
				.selectmenu("refresh");
			postTypeElement
				.selectmenu("refresh");
			postsPerPageElement
				.selectmenu("refresh");
		};

		refreshOptions(_options);
		openDialog($(".optionsDialog"), {
			"buttons": [{
				"click": function(e) {
					$.when(showUsageModeDialog(collectOptions()))
						.then(function(options) {

						refreshOptions(options);
						refreshSelectMenus();
						_options.theme = parseInt(themeElement.val());
						saveOptions();
						loadTheme();
					});
				}
			}, {
				"click": function(e) {
					$(this).dialog("close");
					applyOptions(collectOptions());
				},
				"text": getLocalizedText("ok")
			}, {
				"click": function(e) {
					$(this).dialog("close");
				},
				"text": getLocalizedText("cancel")
			}],
			"maxHeight": $(window).height() * 0.9,
			"maxWidth": $(window).width() * 0.9,
			"open": function(e, ui) {
				refreshSelectMenus();
				$(this)
					.closest(".ui-dialog")
					.find(".ui-dialog-buttonpane")
					.find("button")
					.eq(0)
					.removeClass("ui-button-text-only")
					.addClass("ui-button-icon-only")
					.append($(document.createElement("span"))
						.addClass("ui-icon")
						.addClass("ui-icon-heart"))
					.find(".ui-button-text")
						.html("&nbsp;");
			},
			"width": "auto"
		});
	};

	var showReadLater = function() {
		var refreshClearButton = function(context) {
			$(context)
				.closest(".ui-dialog")
				.find(".ui-dialog-buttonpane")
				.find(".clearButton")
				.button((_readLater && _readLater.length) ?
					"enable" :
					"disable");
		};

		var refreshList = function(context) {
			$(".readLaterDialog")
				.find(".urlList")
				.empty()
				.append($.map(_readLater || [ ], function(item, i) {
					var button,
						href = window.location.sameProtocol(item);

					return $(document.createElement("li"))
						.append(button = createPopoverButton({
							"icon": "ui-icon-info",
							"items": [{
								"click": function(e) {
									showBlogStatistics(window.location.noProtocol(href), true, false, function() {
										$(button)
											.closest(".ui-dialog-content")
											.dialog("close");
									});
								},
								"icon": "ui-icon-info"
							}, {
								"click": function(e) {
									$.when($.confirm(localizedFormat("confirmRemoveFromReadLater", item), undefined, [
										getLocalizedText("yes"),
										getLocalizedText("no")
									])).then(function() {
										$.when(removeFromReadLater(item)).then(function() {
											refreshClearButton(button);
											$(button)
												.closest("li")
												.fadeOut("fast", function() {
													$(this).remove();
												});
										});
									});
								},
								"icon": "ui-icon-circle-close"
							}]
						}).find(".ui-button-text").html("&nbsp;").end())
						.append(embedLink($(document.createElement("a"))
							.attr({
								"href": href
							})
							.text(item)
							.on({
								"click": function(e) {
									$.when(findBlog(window.location.noProtocol(href)))
										.then(function(info) {
											$(e.target)
												.closest(".ui-dialog-content")
												.dialog("close");
											loadBlog(info);
										});
									return e.preventAll();
								}
							})));
				}));
		};

		openDialog($(".readLaterDialog")
			.empty()
			.append($(document.createElement("ul"))
				.addClass("urlList")), {
					"buttons": [{
						"class": "addButton smallDialogButton",
						"click": function(e) {
							var context = this;

							$.when($.prompt("text", ".tumblr.com", undefined, [
								getLocalizedText("ok"),
								getLocalizedText("cancel")
							])).then(function(url) {
								$.when(addToReadLater(url)).then(function() {
									refreshList();
									refreshClearButton(context);
								});
							});
						},
						"text": getLocalizedText("add")
					},{
						"class": "clearButton smallDialogButton",
						"click": function(e) {
							var context = this,
								dialog = $(context);

							$.when($.confirm(getLocalizedText("confirmClearReadLater"), undefined, [
								getLocalizedText("yes"),
								getLocalizedText("no")
							])).then(function() {
								saveReadLater(undefined, true);
								/* dialog.dialog("close"); */
								refreshList();
								refreshClearButton(context);
							});
						},
						"text": getLocalizedText("deleteAll")
					}, {
						"class": "smallDialogButton",
						"click": function(e) {
							$(this).dialog("close");
						},
						"text": getLocalizedText("ok")
					}],
					"destroyOnClose": true,
					"maxHeight": $(window).height() * 0.8,
					"minHeight": $(window).height() * 0.65,
					"minWidth": $(window).width() * 0.5,
					"open": function(e, ui) {
						refreshList();
						$(this)
							.closest(".ui-dialog")
							.find(".ui-dialog-buttonpane")
							.find(".addButton")
								//.button("option", "label", false)
								.button("option", "icons", {
									"primary": "ui-icon-plus"
								})
								.end()
							.find(".clearButton")
								.button("option", "icons", {
									"primary": "ui-icon-trash"
								});
						refreshClearButton(this);
					},
					"position": {
						"my": "top",
						"at": "top+{0}".format(Math.ceil($(window).height() * 0.05))
					},
					"title": getLocalizedText("readLaterTitle")
				});
	};

	var showStatus = function(text, className, clickCallback) {
		return $.when(hideStatus()).then(function() {
			return $.toast({
					"class": $.trim("statusToast clickable ui-state-focus " +
						(className || String.empty)),
					"slow": true,
					"text": text
				})
				.on({
					"click": function(e) {
						if (clickCallback) {
							clickCallback(e);
						}
						return e.preventAll();
					}
				})
				.find(".blogLink")
					.on({
						"click": function(e) {
							var blogURL = $(e.target).attr("blog");

							$("#blogs")
								.find(".blog")
								.each(function(i, blog) {
									if ((blog = $(blog)).data("info").url === blogURL) {
										scrollToBlog(blog);
										return true;
									}
								});
						}
					});
		});
	};

	var showUsageModeDialog = function(options) {
		return $.Deferred(function(deferred) {
			openDialog($(".usageModeDialog")
				.data({
					"options": options
				}), {
					"close": function(e, ui) {
						deferred.resolve($(this).data("options"));
					},
					"dialogClass": "no-title centerButtons",
					"open": function(e, ui) {
						var noOptions, toFocus;

						$(this).find(".ui-button").each(function(i, item) {
							var button = $(item),
								highlight = false,
								mode = button.data("mode"),
								name,
								modeOptions;

							if (modeOptions = mode.options) {
								highlight = true;
								for (name in modeOptions) {
									if (modeOptions[name] !== options[name]) {
										highlight = false;
										break;
									}
								}
							} else if (!noOptions) {
								noOptions = button;
							}
							button[(highlight) ?
								"addClass" :
								"removeClass"]("ui-state-highlight");
							if (highlight && !toFocus) {
								toFocus = button;
							}
						});
						if (!toFocus && noOptions) {
							toFocus = noOptions;
						}
						if (toFocus) {
							toFocus.focus();
						}
					},
					"width": "auto"
				});
		});
	};

	var sortBlogs = function(blogs, blogsAreElements) {
		blogs.sort(function(a, b) {
			if (blogsAreElements) {
				a = a.data("info");
				b = b.data("info");
			}

			if (!a.exists && b.exists) {
				return 1;
			} else if (a.exists && !b.exists) {
				return -1;
			}

			if (!a.isNew && b.isNew) {
				return 1;
			} else if (a.isNew && !b.isNew) {
				return -1;
			}
			if (_options.sortByPosts && a.exists && b.exists && a.isNew && b.isNew) {
				if (a.postsDifference !== b.postsDifference) {
					return (a.postsDifference < b.postsDifference) ? 1 : -1;
				}
			}
			a = (a.title || a.name).toLowerCase();
			b = (b.title || b.name).toLowerCase();

			return (a < b) ? -1 : (a > b) ? 1 : 0;
		});
	};

	var startLoadingImage = function(image, noQueue) {
		var url;

		image = $(image);

		if (image.hasClass("ui-state-error") ||
			!(image.attr("src") === image.data("src") &&
				(image.hasClass("loading") ||
				image.hasClass("loaded")))) {

			if (image.is("img")) {
				image.removeClass("ui-state-error")
					.removeClass("loaded")
					.addClass("ui-state-highlight")
					.addClass("loading");
				setPostLoading(image, true);
			} else {
				noQueue = true;
			}
			if (isAnimated(url = image.data("src")) &&
				_options.customGifControls &&
				!image.closest(".fullScreen").length) {

				createGIFPlayer(image);
			} else {
				image = image.add(getMediaTargetElement(image));
				if (noQueue) {
					loadImageEntry({
						"image": image,
						"src": url
					}, { });
				} else {
					enqueueImageLoad(image, url, noQueue);
				}
			}
		}
	};

	var synchronizeDownloads = function() {
		var downloadsDate,
			restoreMessages = function() {
				delete _store.errorsSuspended;
				delete _store.messagesSuspended;
			};

		_store.errorsSuspended = _store.messagesSuspended = true;
		return $.when(_store.getItem(TABLE_USELESS)).always(function(useless) {
			saveGlobalUseless(useless);
			return $.when(_store.getItem(TABLE_READLATER)).always(function(readLater) {
				var downloadsDate;

				_store.errorsSuspended = false;
				saveReadLater(readLater);
				if (_options.downloadSynchronization !== "skip") {
					$.when(_downloads.getDate()).then(function(date) {
						downloadsDate = date;
					}).always(function() {
						$.toast.message(getLocalizedText("synchronizingDownloads"));
						return $.when(_store.getItem(TABLE_DOWNLOADS + "/" + VALUE_DOWNLOADS_DATE)).then(function(dataStoreDate) {
							dataStoreDate = new Date(dataStoreDate);

							restoreMessages();
							if (!downloadsDate || dataStoreDate.getTime() !== downloadsDate.getTime()) {
								return $.when(_options.downloadSynchronization === "synchronize" ||
									$.confirm(getLocalizedText("requireDownloadsSynchronization"), undefined, [
										getLocalizedText("yes"),
										getLocalizedText("no")
									])).then(function() {
										$.toast.message(getLocalizedText("downloadingDownloads"));
										return $.when(_store.list(TABLE_DOWNLOADS)).then(function(downloads) {
											$.when(_downloads.store(downloads)).then(function() {
												$.when(_downloads.save()).then(function() {
													$.when(_downloads.getCount()).then(function(count) {
														$.toast.message(localizedFormat("downloadsSynchronized", count));
													});
												});
											});
										});
									});
							} else {
								/* $.toast.message(getLocalizedText("downloadsUpToDate")); */
							}
						}, restoreMessages);
					});
				}
			});
		});
	};

	var validateFileName = function(fileName) {
		fileName = fileName.replace(/\\|\/|\:|\*|\?|\"|\||\<|\>|[^\x20-\x7f]/g, "-");

		while (fileName.length && (fileName[0] === " " || fileName[0] === "-")) {
			fileName = fileName.substr(1);
		}
		while (fileName.length && (fileName[fileName.length - 1] === " " || fileName[fileName.length - 1] === "-")) {
			fileName = fileName.substr(0, fileName.length - 1);
		}
		if (fileName[0] === ".") {
			fileName = "-" + fileName.substr(1);
		}
		while (fileName[fileName.length - 1] === ".") {
			fileName = fileName.substr(0, fileName.length - 1);
		}
		return fileName;
	};

	loadPage();
});
