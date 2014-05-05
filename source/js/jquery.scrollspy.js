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
				onEnter: options.onEnter ? options.onEnter : function() {},
				onLeave: options.onLeave ? options.onLeave : function() {},
				onTick: options.onTick ? options.onTick : function() {}
			};

			var options = $.extend({}, defaults, options);

			return this.each(function(i) {
				var element = this;

			});
		}
	});

})(window, jQuery);