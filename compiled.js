(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _fileSaver = require('file-saver');

var _fileSaver2 = _interopRequireDefault(_fileSaver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// Declare component elements
var $body = document.body;
var $canvas = document.querySelector('canvas');
var $avatar = document.createElement('img');
var $prev = document.querySelector('.prev');
var $download = document.querySelector('.download');
var $next = document.querySelector('.next');

// Initialize panning options
var dragStart = { x: 0, y: 0 };
var imgPos = { x: 0, y: 0 };

// Helper function for when downloading
var cloneCanvas = function cloneCanvas(oldCanvas) {
  var newCanvas = document.createElement('canvas');
  var context = newCanvas.getContext('2d');
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;
  context.drawImage(oldCanvas, 0, 0);
  return newCanvas;
};

// Apply a filter to a canvas
var applyFilter = function applyFilter(canvas) {
  return function (url) {
    return new Promise(function (resolve, reject) {
      var image = document.createElement('img');
      image.src = url;
      image.onload = function () {
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas);
      };
    });
  };
};

// Draw an avatar to a canvas
var drawAvatar = function drawAvatar(url) {
  imgPos = { x: 0, y: 0 };
  $avatar.src = url;
  $avatar.onload = function () {
    // Set the $canvas size to the $avatars shortest side
    $canvas.width = Math.min($avatar.width, $avatar.height);
    $canvas.height = Math.min($avatar.width, $avatar.height);
    // Draw the avatar $avatar to $canvas
    $canvas.getContext('2d').drawImage($avatar, 0, 0, $avatar.width, $avatar.height);
  };
};

// Create file blob from dataUrl and initiate a download
var download = function download(dataUrl) {
  var c = cloneCanvas($canvas);
  var f = document.querySelector('.active').src;
  applyFilter(c)(f).then(function (res) {
    var dataUrl = res.toDataURL('image/jpg');
    var data = atob(dataUrl.substring("data:image/png;base64,".length));
    var asArray = new Uint8Array(data.length);
    for (var i = 0, len = data.length; i < len; ++i) {
      asArray[i] = data.charCodeAt(i);
    }var f = new Blob([asArray.buffer], { type: 'application/octet-stream' });
    _fileSaver2.default.saveAs(f, "filter.jpg");
  });
};

// Move $avatar around canvas according to drag event
var track = function track(e) {
  var x = Math.max(Math.min(imgPos.x + (e.pageX - dragStart.x), 0), $canvas.width - $avatar.width);
  var y = Math.max(Math.min(imgPos.y + (e.pageY - dragStart.y), 0), $canvas.height - $avatar.height);
  // Draw the avatar on the $canvas
  $canvas.getContext('2d').drawImage($avatar, x, y, $avatar.width, $avatar.height);
};

// Setup at the start of a drag event
var start = function start(e) {
  dragStart = { x: e.pageX, y: e.pageY };
  $body.addEventListener('mousemove', track);
};

// Teardown ar the end of a drag event
var stop = function stop(e) {
  $body.removeEventListener('mousemove', track);
  imgPos = {
    x: Math.max(Math.min(imgPos.x + (e.pageX - dragStart.x), 0), $canvas.width - $avatar.width),
    y: Math.max(Math.min(imgPos.y + (e.pageY - dragStart.y), 0), $canvas.height - $avatar.height)
  };
};

// Extract image dataUrl from drop event
var processInput = function processInput(e) {
  e.stopPropagation();
  e.preventDefault();
  // Setup file reader
  var reader = new FileReader();
  var file = e.dataTransfer.files[0];
  var acceptedFiles = ['png', 'bmp', 'jpg', 'jpeg', 'gif'];
  // Ensure that the file type
  if (!acceptedFiles.includes(file.type.replace('image/', ''))) {
    alert('Incompatible file type!');
    return;
  }
  // Initiate reading of file
  reader.onload = function (file) {
    return drawAvatar(file.srcElement.result);
  };
  reader.readAsDataURL(file);
};

var nextFilter = function nextFilter() {
  var overlay = document.querySelector('overlay-');
  var index = parseInt(overlay.dataset.index, 10);
  if (index < overlay.children.length - 1) {
    overlay.dataset.index = ++index;
    overlay.style.transform = 'translateX(-' + index * 62 + 'vmin)';
    // Add active class to focus filter
    [].concat(_toConsumableArray(overlay.children)).forEach(function (x) {
      return x.classList.remove('active');
    });
    overlay.children[index].classList.add('active');
  }
};

var prevFilter = function prevFilter() {
  var overlay = document.querySelector('overlay-');
  var index = parseInt(overlay.dataset.index, 10);
  if (index > 0) {
    overlay.dataset.index = --index;
    overlay.style.transform = 'translateX(-' + index * 62 + 'vmin)';
    // Add active class to focus filter
    [].concat(_toConsumableArray(overlay.children)).forEach(function (x) {
      return x.classList.remove('active');
    });
    overlay.children[index].classList.add('active');
  }
};

// Create a drag-and-drop interface for images on entire body
$body.addEventListener('dragover', function (e) {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});
// When the user drops or inputs an image process the image
$body.addEventListener('drop', processInput);

// Pan image on drag from $canvas
$canvas.addEventListener('mousedown', start);
// Stop any tracking at end of drag
$body.addEventListener('mouseup', stop);
$body.addEventListener('mouseleave', stop);

// When the user uses the arrow keys to change filter
$body.addEventListener('keyup', function (e) {
  // Right arrow for next filter
  if (e.keyCode === 39) nextFilter();
  // Left arrow for previous filter
  if (e.keyCode === 37) prevFilter();
  // Spacebar from download
  if (e.keyCode === 32) download();
});

// Listen for interaction with controls
$next.addEventListener('click', nextFilter);
$download.addEventListener('click', download);
$prev.addEventListener('click', prevFilter);

// Apply default avatar
drawAvatar('avatar.jpg');

},{"file-saver":2}],2:[function(require,module,exports){
/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.3.2
 * 2016-06-16 18:25:19
 *
 * By Eli Grey, http://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = new MouseEvent("click");
			node.dispatchEvent(event);
		}
		, is_safari = /constructor/i.test(view.HTMLElement) || view.safari
		, is_chrome_ios =/CriOS\/[\d]+/.test(navigator.userAgent)
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
		, arbitrary_revoke_timeout = 1000 * 40 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			setTimeout(revoker, arbitrary_revoke_timeout);
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, force = type === force_saveable_type
				, object_url
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
						// Safari doesn't allow downloading of blob urls
						var reader = new FileReader();
						reader.onloadend = function() {
							var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
							var popup = view.open(url, '_blank');
							if(!popup) view.location.href = url;
							url=undefined; // release reference before dispatching
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
						};
						reader.readAsDataURL(blob);
						filesaver.readyState = filesaver.INIT;
						return;
					}
					// don't create more object URLs than needed
					if (!object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (force) {
						view.location.href = object_url;
					} else {
						var opened = view.open(object_url, "_blank");
						if (!opened) {
							// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
							view.location.href = object_url;
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
			;
			filesaver.readyState = filesaver.INIT;

			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setTimeout(function() {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}

			fs_error();
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name, no_auto_bom) {
			return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name, no_auto_bom) {
			name = name || blob.name || "download";

			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name);
		};
	}

	FS_proto.abort = function(){};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd !== null)) {
  define("FileSaver.js", function() {
    return saveAs;
  });
}

},{}]},{},[1]);
