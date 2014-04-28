(function (window, $) {

    var guid = 0;

    function ScrollSpy(options) {
        var o = $.extend({}, ScrollSpy.defaults, options);
        // 决定绑定滚动事件的元素
        this.options = o;
        this.container = $(o.container);
        this.elem = $(o.element);
        if (!this.elem.length || this.elem.data('bind-scrollSpy')) {
            return this;
        }
        this.spyId = guid++;

        var self = this;
        this.container.on('scroll.scrollSpy' + this.spyId, function () {
            self.process.call(self);
        });
        this.elem.data('bind-scrollSpy', true);
        this.adjust();
        this.process();
    }

    ScrollSpy.defaults = {
        container: window,
        offset: 10,
        activeClass: 'active',
        callback: function () {
        }
    };


    ScrollSpy.prototype = {
        constructor: ScrollSpy,
        adjust: function () {
            this.offsets = [];
            this.targets = [];
            this.activeTarget = null;

            var isWindow = $.isWindow(this.container),
                offsetMethod = isWindow ? 'offset' : 'position',
                self = this;

            $(this.elem).find('li a').map(function () {
                var link = $(this),
                    selector = link.attr('href'),
                    target = /^#./.test(selector) && $(selector);

                return (target && target.length && target.is(':visible') && [
                    [target[offsetMethod]().top + (isWindow ? 0 : self.elem.scrollTop()),
                        selector
                    ]
                ]) || null;

            }).sort(function (a, b) {
                return a[0] - b[0];
            }).each(function () {
                // 收集偏离值
                self.offsets.push(this[0]);
                // 收集href值（ID 选择器）
                self.targets.push(this[1]);
            });
        },
        process: function () {
            var scrollTop = this.container.scrollTop() + this.options.offset,
            // 内容的高度
                scrollHeight = this.container[0].scrollHeight || Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
                maxScroll = scrollHeight - this.container.height(),// 最大可以滚动的高度
                offsets = this.offsets,
                targets = this.targets,
                activeTarget = this.activeTarget,
                i;
            if (scrollTop >= maxScroll) {
                return activeTarget != (i = targets[targets.length - 1]) && this.active(i);
            }

            if (activeTarget && scrollTop <= offsets[0]) {
                return activeTarget != (i = targets[0]) && this.active(i);
            }

            for (i = offsets.length; i--;) {
                // 遍历offset中，寻找一个最接近顶部的元素
                activeTarget != targets[i]
                && scrollTop >= offsets[i]
                && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
                && this.active(targets[i]);
            }
        },
        active: function (target) {
            var oldTarget = this.activeTarget,
                activeClass = this.options.activeClass;
            this.activeTarget = target;
            $(this.elem).find('li a')
                .parent('li.' + activeClass).removeClass(activeClass)
                .end()
                .filter('[href=' + target + ']').parent('li').addClass(activeClass);

            this.options.callback.call(this, oldTarget, target);
        },
        destroy: function () {
            this.container.off('scroll.scrollSpy' + this.spyId);
            this.elem.data('bind-scrollSpy', false);
        }
    };

    function scrollSpy(element, options) {
        options = options || {};
        options.element = element;
        return new ScrollSpy(options);
    }

    // API
    scrollSpy.defaults = ScrollSpy.defaults;
    window.scrollSpy = scrollSpy;


})(window, jQuery);