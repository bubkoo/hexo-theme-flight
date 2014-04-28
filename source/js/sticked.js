(function(window, $) {

	var sticked = false;

	function check() {
		if (window.jTopiced) {
			var elem = $('#topic-list');
			if (elem && elem.length) {
				sticky(elem, {
					top: 30
				});

				scrollSpy('#topic-list > .topic-tree');
			}
			sticked = true;
		} else {
			window.setTimeout(check, 50);
		}
	}

	var oldLoad = window.onload;
	window.onload = function() {
		if (oldLoad) {
			oldLoad();
		}
		if (!sticked) {
			window.jTopiced = true;
			window.setTimeout(check, 1000);
		}
	};
})(window, jQuery);