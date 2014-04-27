!window.monitor || (function (window, undefined) {
    var doc = window.document,
        loc = window.location,
        M = window.monitor,
        _TIMER = {},
        reg_fun = /^function\b[^\)]+\)/,
        MODE = {
            ONLINE: 0,
            DEV: 1
        },
        mode = MODE.DEV, // 产品模式

        SEND_STATUS = {
            COMPLETED: 0,
            SENDING: 1
        },
        sendState = SEND_STATUS.COMPLETED, // 发送状态

        scriptHome,
        scriptList,

        LOG_SERVER, // 日志服务器

        readyTime = new Date() - M._startTime,
        loadTime = readyTime * 1.7,
        UNKNOWN_INFO = {
            name: "",
            version: []
        };

    M.version = '1.0.0';
    M.isDomReady = false; // 页面DOM加载完成
    M.isLoaded = false;   // 页面加载完成
    M.debug = mode === MODE.DEV || false;
    M.rethrow = true;
    M.delay = 1800;
    M.timeout = 2000;
    M.nocache = false; // 缓存
    M.res = {
        img: [],
        css: [],
        js: [],
        fla: []
    };


    M.client = !!window.light ? light.client.info : {
        os: UNKNOWN_INFO,
        browser: UNKNOWN_INFO,
        device: UNKNOWN_INFO,
        engine: UNKNOWN_INFO
    };

    M._loc = {
        protocol: loc.protocol,
        hostname: loc.hostname,
        pathname: loc.pathname,
        href: loc.href,
        hash: loc.hash
    };

    M.url = M._loc.href;

    M.S = {

        startsWith: function (str, ch) {
            if (typeof (str) === undefined || typeof (ch) === undefined) {
                return false;
            }
            return str.indexOf(ch) === 0;
        },

        endsWith: function (str, ch) {
            if (typeof (str) === undefined || typeof (ch) === undefined) {
                return false;
            }
            return str.lastIndexOf(ch) == (str.length - ch.length);
        },

        byteLength: function (str) {
            if (!str) {
                return 0;
            }
            return str.replace(/[^\x00-\xff]/g, 'xx').length
        },

        isLower: function (str) {
            if (typeof (str) === undefined) {
                return false;
            }
            return str === str.toLowerCase();
        },

        repeat: function (str, times) {
            return new Array((times || 0) + 1).join(str);
        },

        trim: function (str) {
            return str.replace(/^\s+/, '').replace(/\s+$/, '');
        },

        camelize: function (str) {
            return str.replace(/\-+([a-z])/g, function ($0, $1) {
                return $1.toUpperCase();
            })
        },

        rand: function () {
            var s = '' + Math.random(),
                l = s.length;
            return s.substr(2, 2) + s.substr(l - 2)
        }
    };

    M.URI = {
        reFolderExt: /[^\/]*$/,
        reProtocol: /^\w+:/,
        reDataURI: /^data:/,

        abs: function (uri) { // 绝对路径
            if (!M.URI.reProtocol.test(uri)) {
                if (uri.indexOf("/") === 0) {// 相对网站根路径，例如 /pages/index.html
                    uri = M._loc.protocol + "//" + M._loc.hostname + uri;
                } else {
                    if (uri.indexOf(".") == 0) { // 相对路径，例如 ../pages/index.html
                        uri = M._loc.protocol + "//" + M._loc.hostname + M._loc.pathname.replace(M.URI.reProtocol, uri);
                    } else {
                        uri = M.URI.folder(M._loc.href) + uri;
                    }
                }
            }
            return uri;
        },

        parse: function (uri) {
            if (!uri || typeof (uri) !== 'string') {
                return '';
            }
            var host = M._loc.protocol + '//' + M._loc.hostname,
                base = host + M._loc.pathname.replace(M.URI.reFolderExt, uri);
            var a = doc.createElement('a');
            a.setAttribute('href', M.URI.abs(uri));
            return a;
        },

        isExternalRes: function (uri) {
            if (!uri || typeof (uri) !== 'string') {
                return false;
            }
            return  0 === uri.indexOf('http:') || 0 === uri.indexOf('https:') || 0 == uri.indexOf('file:');
        },

        path: function (uri) {
            if (!uri || typeof (uri) !== 'string') {
                return '';
            }
            var idx = 0;
            do {
                idx = uri.indexOf('?', idx);
                if (idx < 0) {
                    break;
                }
                if ('?' === uri.charAt(idx + 1)) {
                    idx += 2;
                } else {
                    break;
                }
            } while (idx >= 0);
            return idx < 0 ? uri : uri.substr(0, idx)
        },

        folder: function (uri) {
            if (!uri || typeof (uri) !== 'string') {
                return '';
            }
            var idx = uri.lastIndexOf('/');
            return idx < 0 ? '' : uri.substr(0, idx + 1);
        }
    };

    var $JSON = {

        escape: function (str) {
            return str.replace(/\r|\n/g, "").replace(/\\/g, "\\\\").replace(/\"/g, '\\"');
        },

        toString: function (obj) {
            switch (typeof obj) {
                case 'string':
                    return '"' + $JSON.escape(obj) + '"';
                case 'number':
                    return isFinite(obj) ? String(obj) : 'null';
                case 'boolean':
                case 'null':
                    return String(obj);
                case 'undefined':
                    return 'null';
                case 'object':
                    if (null === obj) {
                        return 'null';
                    }
                    var type = Object.prototype.toString.call(obj);
                    if ('[object Array]' === type) {
                        var arr = [];
                        for (var i = 0, l = obj.length; i < l; i++) {
                            arr[i] = $JSON.toString(obj[i])
                        }
                        return '[' + arr.join(',') + ']';
                    } else {
                        if ('[object RegExp]' === type) {
                            return '/' + obj.source + '/' + (obj.ignoreCase ? 'i' : '') + (obj.multiline ? 'm' : '') + (obj.global ? 'g' : '')
                        } else {
                            var objArr = [];
                            for (var key in obj) {
                                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                                    objArr.push('"' + $JSON.escape(key) + '":' + $JSON.toString(obj[key]));
                                }
                            }
                            return '{' + objArr.join(',') + '}';
                        }
                    }
                default:
            }
        }
    };

    var clientInfo = {
        dev: M.client.device.name + "/" + M.client.device.version.join("."),
        os: M.client.os.name + "/" + M.client.os.version.join("."),
        scr: window.screen.width + "x" + window.screen.height + "x" + window.screen.colorDepth,
        bro: M.client.browser.name + "/" + M.client.browser.version.join("."),
        eng: M.client.engine.name + "/" + M.client.engine.version.join(".")
    };

    var URLLength = !!M.client.engine.trident ? 2083 : 8190;
    var COMMON_DATA = {
        url: M.url,
        ref: doc.referrer,
        client: clientInfo
    };

    // 根据域名来判断是什么模式
    LOG_SERVER = "http://monitor.bubkoo.com/m.gif";
    scriptHome = "/js/";
    scriptList = ["monitor-d-0.7.0.js"];


    function identify() {
        var b = doc.cookie + navigator.userAgent + navigator.plugins.length + Math.random(),
            n = 0;
        for (var i = 0, l = b.length; i < l; i++) {
            n += i * b.charCodeAt(i);
        }
        return n.toString(parseInt(Math.random() * 10 + 16));
    }

    function getFunName(caller) {
        var mc = String(caller).match(reg_fun);
        return mc ? mc[0] : '';
    }

    // 加载脚本
    function loadJs(src) {
        if (M.nocache) {
            src += (src.indexOf("?") >= 0 ? "&" : "?") + M.S.rand()
        }
        var script = doc.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.setAttribute("charset", "utf-8");
        script.setAttribute("src", src);
        var hd = doc.getElementsByTagName("head");
        if (hd && hd.length > 0) {
            hd = hd[0];
        }
        hd = hd && hd.length > 0 ? hd[0] : doc.documentElement;
        hd.appendChild(script);
    }

    // 深度克隆
    function clone(obj) {
        var result;
        if (null == obj) {
            return null;
        }
        switch (typeof obj) {
            case "string":
            case "number":
            case "boolean":
                result = obj;
                break;
            case "object":
                if (obj instanceof Array) {
                    result = [];
                    for (var i = obj.length - 1; i >= 0; i--) {
                        result[i] = clone(obj[i]);
                    }
                } else if (obj instanceof RegExp) {
                    result = new RegExp(obj.source, (obj.ignoreCase ? "i" : "") + (obj.global ? "g" : "") + (obj.multiline ? "m" : ""));
                } else if (obj instanceof Date) {
                    result = new Date(obj.valueOf())
                } else if (obj instanceof Error) {
                    result = obj;
                } else if (obj instanceof Object) {
                    result = {};
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            result[key] = clone(obj[key]);
                        }
                    }
                }
                break;
            default:
                throw new Error("Not support the type.");
        }
        return result;
    }

    // 合并对象
    function merge(obj, source) {
        for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                obj[key] = source[key];
            }
        }
        return obj;
    }

    function part(arr, len) {
        var data = arr.slice(0),
            list = [
                []
            ],
            idx = 0;
        while (data.length > 0) {
            if (encodeURIComponent($JSON.toString(list[idx].concat(data[0]))).length < len) {
                list[idx].push(data.shift());
            } else {
                list[++idx] = [];
                list[idx].push(data.shift());
            }
        }
        return list;
    }

    M.report = function (data) {
        if (!data) {
            return;
        }
        if (data.hasOwnProperty("htmlError")) {
            var list = part(data.htmlError, URLLength - encodeURIComponent($JSON.toString(COMMON_DATA)).length - 150);
            for (var i = 0, l = list.length; i < l; i++) {
                M._errors.push({
                    htmlError: list[i]
                })
            }
        } else {
            M._errors.push(data);
        }
        M.timedSend();
    };
    // try..catch.. 异常调用
    M.error = function (err) {
        if (!(err instanceof Error)) {
            return;
        }

        var stack = err.stack || '';
        // 获取调用链
        if (!stack && arguments.callee.caller) {
            // 获取函数的调用堆栈
            var myCaller = arguments.callee.caller,
                callStack = [];
            for (var i = 0; i <= 20; i++) {
                if (myCaller.arguments && myCaller.arguments.callee && myCaller.arguments.callee.caller) {
                    myCaller = myCaller.arguments.callee.caller;
                    callStack.push("at " + getFunName(myCaller));
                    if (myCaller.caller === myCaller) {
                        break;
                    }
                }
            }
            stack = callStack.join("\n")
        }

        M._errors.push({
            jsError: {
                msg: err.message || err.description || '',
                name: err.name || '',
                num: err.number || 0,
                file: err.fileName || '',
                ln: err.lineNumber || err.line || 0,
                cn: err.columnNumber || err.column || 0,
                stack: stack
            }
        });
        M.timedSend();
    };

    // 开始记录时间
    M.timeStart = function (name) {
        _TIMER[name] = M._now();
    };
    // 结束记录时间，并发送到服务器
    M.timeEnd = function (name) {
        var start = _TIMER[name];
        if (!start) {
            return NaN;
        }

        var now = M._now(),
            timeSpan = now - start;
        M._errors.push({
            time: {
                'name': name,
                'time': timeSpan
            }
        });
        M.timedSend();
        return timeSpan;
    };

    function send(url, data, callback) {
        if (!callback) {
            callback = function () {
            };
        }
        if (!data) {
            callback();
            return;
        }
        var d = encodeURIComponent(data);
        url = url + (url.indexOf('?') < 0 ? '?d=' : '&d=') + d;
        try {
            var img = new Image(1, 1);

            function clearImage() {
                window.clearTimeout(timer);
                timer = null;
                if (!img.aborted) {
                    callback();
                    img.aborted = true;
                }
                img.onload = img.onerror = img.onabort = null;
                img = null;
            }

            img.onload = clearImage;
            img.onerror = clearImage;
            img.onabort = clearImage;
            img.src = url;

            var timer = window.setTimeout(function () { // 超时处理
                try {
                    img.src = null;
                    img.aborted = true;
                    clearImage()
                } catch (ex) {
                }
            }, M.timeout);

        } catch (ex) {
        }
    }

    M.timedSend = function () {
        if (sendState === SEND_STATUS.SENDING) {
            return;
        }
        var err = M._errors.shift();
        if (!err) {
            sendState = SEND_STATUS.COMPLETED;
            return;
        }
        sendState = SEND_STATUS.SENDING;
        var common_data = clone(COMMON_DATA);
        if (Object.prototype.hasOwnProperty.call(err, "jsError")) {
            err.jsError.file = M.URI.path(err.jsError.file);
        }
        common_data = merge(common_data, err);
        common_data.rnd = M.S.rand();
        try {
            send(LOG_SERVER, $JSON.toString(common_data), function () {
                sendState = SEND_STATUS.COMPLETED;
                M.timedSend();
            })
        } catch (e) {
            console.log(e);
            sendState = SEND_STATUS.COMPLETED;
        }
    };

    // 事件绑定
    function addEvent(target, evt, handler) {
        if (target.addEventListener) {// 标准
            target.addEventListener(evt, handler, false);
        } else if (target.attachEvent) {// 低版本 IE
            target.attachEvent('on' + evt, handler);
        } else {
            target['on' + evt] = handler;
        }
    }

    (function () {

        function loadHandler() {
            if (!loadHandler.invoked) {
                loadHandler.invoked = true;
                loadTime = M._now() - M._startTime;
                M.isLoaded = true;
            }
        }

        function readyHandler() {
            if (!readyHandler.invoked) {
                readyHandler.invoked = true;
                readyTime = M._now() - M._startTime;
                M.isDomReady = true;
            }
        }

        function contentLoad() {
            if (document.addEventListener || event.type === "load" || document.readyState === "complete") {
                readyHandler();
                if (document.addEventListener) {
                    document.removeEventListener("DOMContentLoaded", contentLoad, false);
                    window.removeEventListener("load", contentLoad, false);

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
                                setTimeout(doScrollCheck, 50);
                                return;
                            }
                            contentLoad();
                        }
                    })();
                }
            }
        }

        addEvent(window, 'load', loadHandler);
        addEvent(window, 'unload', loadHandler);

    }());

    function sendPerformance() {
        try {
            if (M.isDomReady && M.isLoaded) {
                M._errors.push({
                    performance: {
                        domReady: readyTime,
                        load: loadTime
                    }
                });
                if (M.debug && window.console && console.log) {
                    console.log('domReady: ' + readyTime + 'ms, loaded: ' + loadTime + 'ms');
                }
                M.timedSend();
                if (M.client.engine.name === 'trident' && M.client.engine.version[0] <= 7) { // IE 6
                    return;
                }
                if (mode === MODE.DEV) {
                    for (var i = 0, l = scriptList.length; i < l; i++) {
                        loadJs(scriptHome + scriptList[i]);
                    }
                } else {
                    loadJs(scriptHome + scriptList.join(","));
                }
            } else {
                window.setTimeout(function () {
                    sendPerformance();
                }, M.delay)
            }
        } catch (err) {
        }
    }

    window.setTimeout(function () {
        sendPerformance();
    }, M.delay);

})(window);