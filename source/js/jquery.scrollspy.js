;
(function(window, $, undefined) {
	$.fn.extend({
		scrollspy: function(options) {
			var defaults = {
				min: 0,
				max: 0,
				vertical: true,
				offset: 0,
				container: window,
				onEnter: options.onEnter ? options.onEnter : [],
				onLeave: options.onLeave ? options.onLeave : [],
				onTick: options.onTick ? options.onTick : []
			};

			var options = $.extend({}, defaults, options);

            return this.each(function (i) {
                var element = this;
            });
		}
	});
})(window, jQuery);