/**
 * 嗅探页面加载事件
 * Created by Jhonny.Peng on 14-3-5.
 */
define(function (require, exports, module) {

    var M = require("monitor"),
        window = window,
        doc = window.document,
        readyTime,
        loadTime,
        isDomReady = false,
        isLoaded = false;

    function dispatchEvent(ele, evt, handler) {
        /**
         * 事件绑定
         */
        if (ele.attachEvent) {
            ele.attachEvent('on' + evt, function (args) {
                handler.call(ele, args)
            });
        } else if (ele.addEventListener) {
            ele.addEventListener(evt, handler, false);
        } else {
            ele['on' + evt] = function (args) {
                handler.call(ele, args)
            }
        }
    }

    function loadHandler() {
        if (!loadHandler.invoked) {
            loadHandler.invoked = true;
            // 需要在页面上埋点 __start__
            loadTime = window.__start__ ? M.now() - window.__start__ : NaN;
            isLoaded = true;
        }
    }

    function readyHandler() {
        if (!readyHandler.invoked) {
            readyHandler.invoked = true;
            // 需要在页面上埋点 __start__
            readyTime = window.__start__ ? M.now() - window.__start__ : NaN;
            isDomReady = true;
        }
    }

    function contentLoad() {
        if (document.addEventListener || event.type === 'load' || document.readyState === 'complete') {
            readyHandler();
            // 删除事件绑定
            if (document.addEventListener) {
                document.removeEventListener('DOMContentLoaded', contentLoad, false);
                window.removeEventListener('load', contentLoad, false);

            } else {
                document.detachEvent("onreadystatechange", contentLoad);
                window.detachEvent("onload", contentLoad);
            }
        }
    }

    if (window.jQuery) {
        jQuery(readyHandler);
    } else if (window.YAHOO && YAHOO.util && YAHOO.util.Event) {
        window.YAHOO.util.Event.onDOMReady(readyHandler);
    } else {
        if (doc.readyState === "complete") {
            setTimeout(readyHandler, 0);
        } else if (window.addEventListener) {
            doc.addEventListener('DOMContentLoaded', contentLoad, false);
            window.addEventListener("load", contentLoad, false);
        } else {// 低版本 IE
            doc.attachEvent("onreadystatechange", contentLoad);
            window.attachEvent("onload", contentLoad);

            var top = false;
            try {
                // 如果文档处于 iframe 中，调用 doScroll 方法成功时并不代表DOM加载完毕
                top = window.frameElement == null && doc.documentElement;
            } catch (e) {
            }
            if (top && top.doScroll) {
                (function doScrollCheck() {
                    if (!readyHandler.invoked) {
                        try {
                            top.doScroll("left");
                        } catch (e) {
                            window.setTimeout(doScrollCheck, 50);
                            return;
                        }
                        contentLoad();
                    }
                })();
            }
        }
    }

    dispatchEvent(window, 'load', loadHandler);
    dispatchEvent(window, 'unload', loadHandler);

    function sendPerformance() {
        try {
            if (isDomReady && isLoaded) {
                M.push({
                    type: 'perf',
                    ready: readyTime,
                    load: loadTime
                });
                M.log('domReady: ' + readyTime + ', loaded: ' + loadTime);
            } else {
                window.setTimeout(function () {
                    sendPerformance();
                }, 1800)
            }
        } catch (err) {
        }
    }

    window.setTimeout(function () {
        sendPerformance();
    }, 1800);

});