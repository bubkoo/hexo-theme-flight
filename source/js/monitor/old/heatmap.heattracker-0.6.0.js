;
(function (window, undefined) {

    window.HeatTracker = function (id, _rate) {

        var D = {
                hasAttr: function (elem, attr) {
                    if (!elem || 1 !== elem.nodeType) {
                        return false;
                    }
                    if (elem.hasAttribute) {
                        return elem.hasAttribute(attr);
                    }
                    if ('style' == attr) {
                        return '' !== elem.style.cssText;
                    }
                    var val = elem.getAttribute(attr);
                    if (null == val) {
                        return false;
                    } else {
                        if ('function' === typeof (val)) {
                            return val.toString().indexOf('function ' + attr + '()') === 0;
                        } else {
                            return true;
                        }
                    }
                }
            },
            doc = window.document,
            rate = _rate, // 采样频率，值越小越频繁，大于等于1时将不会采样
            heatAttr = 'coor', // 热点块属性名
            defaultHeatPoint = 'default', // 默认热点块的名称
            rateAttr = "coor-rate", // 采样频率
            separator = '-',
            posCache = {},
            assignedId = false,
            defaultNode,
            scrW = screen.width,
            scrH = screen.height;


        function preProcess() { // 如果没有指定热点块名称，则进行预处理
            var nodes = doc.getElementsByTagName("*"),
                node,
                heatPoint,
                pos,
                i,
                l = nodes.length;
            for (i = 0; i < l; i++) {
                if (D.hasAttr(nodes[i], heatAttr)) {
                    node = nodes[i];
                    heatPoint = node.getAttribute(heatAttr);
                    pos = getNodePos(node);
                    posCache[heatPoint] = pos;
                    if (defaultHeatPoint === heatPoint) {
                        rate = parseFloat(node.getAttribute(rateAttr)) || 0.8;
                    } else {
                        if (0 === heatPoint.indexOf(defaultHeatPoint + separator) && !posCache.hasOwnProperty(defaultHeatPoint)) {
                            posCache[defaultHeatPoint] = pos;
                            rate = parseFloat(node.getAttribute(rateAttr)) || 0.8;
                        }
                    }
                }
            }
        }

        function getNodePos(node) {
            var x = 0,
                y = 0;
            do {
                x += node.offsetLeft;
                y += node.offsetTop;
            }
            while (node = node.offsetParent);
            return [x, y];
        }

        function getNodeSeedName(node) {
            var result;

            do if (D.hasAttr(node, "seed")) {
                result = node.getAttribute("seed");
                break;
            }
            while (node = node.parentNode);
            return result || '';
        }

        function getHeatBlockName(node) {// 获取热点块块名称
            if (!assignedId) {
                return id;
            }
            do {
                if (D.hasAttr(node, heatAttr)) {
                    return node.getAttribute(heatAttr);
                }
            }
            while (node = node.parentNode);
            return defaultHeatPoint;
        }

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


        if (!HeatTracker.invoked) {

            HeatTracker.invoked = true;

            if (undefined === typeof id) {// 如果没有指定要采集的元素的 ID 则是整也热点采集
                preProcess();
                assignedId = true;
            }
            else {
                defaultNode = doc.getElementById(id);
                if (defaultNode) {
                    posCache[defaultHeatPoint] = posCache[id] = getNodePos(defaultNode);
                    assignedId = false;
                }
                else {
                    return;
                }
            }
            if (undefined === typeof rate) {
                rate = 1;
            }

            if (0 === Math.floor(Math.random() / rate) && posCache.hasOwnProperty(defaultHeatPoint)) {

                dispatchEvent(doc, 'mousedown', function (event) {
                    var e = window.event || event,
                        isLeftButton = e.which ? 1 == e.which : 1 == e.button,
                        isRightButton = e.which ? 3 == e.which : 2 == e.button,
                        ele = e.target || e.srcElement, // 触发事件的元素
                        seedName,// 被埋点的元素的埋点名称
                        curHeatBlock, // 当前所处的热点块
                        mousePos, // 鼠标相对于页面的位置
                        relatedX, // 鼠标相对于热点块的位置 X
                        relatedY; // 鼠标相对于热点块的位置 Y


                    seedName = getNodeSeedName(ele);
                    if (isLeftButton || isRightButton) {// 左键或右键点击

                        curHeatBlock = getHeatBlockName(ele);
                        // 获取鼠标在页面上的位置的
                        if (e.pageX) {
                            mousePos = [e.pageX , e.pageY];
                        } else {
                            if ('CSS1Compat' === doc.compatMode) {
                                mousePos = [doc.documentElement.scrollLeft + e.clientX, doc.documentElement.scrollTop + e.clientY];
                            } else {
                                mousePos = [doc.body.scrollLeft + e.clientX, doc.body.scrollTop + e.clientY];
                            }
                        }
                        relatedX = mousePos[0] - posCache[curHeatBlock][0];
                        relatedY = mousePos[1] - posCache[curHeatBlock][1];

                        try {
                            var info = ["heatTracker:", relatedX, "x", relatedY, "^", curHeatBlock, "^", scrW, "x", scrH].join("");
                            Tracker.click(info, {
                                target: seedName
                            })
                        } catch (err) {
                            if (window.console && console.log) {
                                console.log(info);
                            }
                        }
                    }
                });
            }
        }
    }

    window.setTimeout(function () {
        HeatTracker()
    }, 200);

})(window);

