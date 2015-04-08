(function (window, undefined) {
    var document = window.document;

    function ready(callback) {

        if (typeof callback !== 'function') {
            return;
        }

        var isReady = false;

        function fire() {
            isReady = true;
            callback();
        }

        function completed() {
            // readyState === "complete" is good enough for us to call the dom ready in oldIE
            if (document.addEventListener || event.type === 'load' || document.readyState === 'complete') {
                detach();
                fire();
            }
        }

        function detach() {
            if (document.addEventListener) {
                document.removeEventListener('DOMContentLoaded', completed, false);
                window.removeEventListener('load', completed, false);
            } else {
                document.detachEvent('onreadystatechange', completed);
                window.detachEvent('onload', completed);
            }
        }

        // already loaded when comes here
        if (document.readyState === 'complete') {
            fire();
        } else if (document.addEventListener) {
            // Use the handy event callback
            document.addEventListener('DOMContentLoaded', completed, false);
            // A fallback to window.onload, that will always work
            window.addEventListener('load', completed, false);
        } else { // IE
            // Ensure firing before onload, maybe late but safe also for iframes
            document.attachEvent('onreadystatechange', completed);
            // A fallback to window.onload, that will always work
            window.attachEvent('onload', completed);

            // If IE and not a frame
            // continually check to see if the document is ready
            var top = false;

            try {
                top = window.frameElement == null && document.documentElement;
            } catch (e) {}

            if (top && top.doScroll) {
                (function doScrollCheck() {
                    if (isReady) {

                        try {
                            top.doScroll('left');
                        } catch (e) {
                            return setTimeout(doScrollCheck, 50);
                        }
                        detach();
                        fire();
                    }
                })();
            }
        }
    }

    function detect() {
        var root = document.getElementById('wrapper'),
            spliter = '.',
            children;

        root = root.querySelector('.entry');
        if (!root || !(children = root.childNodes)) {
            return;
        }

        var i = 0,
            len = children.length,
            level2 = 0,
            level3 = 0,
            level4 = 0,
            level5 = 0,
            level6 = 0,
            elem,
            titles = [];
        for (; i < len; i++) {
            elem = children[i];
            if (elem.nodeType !== 1) {
                continue;
            }
            elem.tagName.replace(/h([23456])/i, function (input, level) {
                var text = elem.innerText || elem.textContent,
                    matches,
                    link,
                    title;
                level = parseInt(level);
                title = {
                    level: level,
                    text: text
                };
                switch (level) {
                    case 2:
                        level2++;
                        level3 = 0;
                        level4 = 0;
                        level5 = 0;
                        level6 = 0;
                        title.prefix = level2 + spliter;
                        break;
                    case 3:
                        level3++;
                        level4 = 0;
                        level5 = 0;
                        level6 = 0;
                        title.prefix = (level2 === 0 ? '' : level2 + spliter) + level3 + spliter;
                        break;
                    case 4:
                        level4++;
                        level5 = 0;
                        level6 = 0;
                        title.prefix = (level2 === 0 ? '' : level2 + spliter) + (level3 === 0 ? '' : level3 + spliter) + level4 + spliter;
                        break;
                    case 5:
                        level5++;
                        level6 = 0;
                        title.prefix = (level2 === 0 ? '' : level2 + spliter) + (level3 === 0 ? '' : level3 + spliter) + (level4 === 0 ? '' : level4 + spliter) + level5 + spliter;
                        break;
                    case 6:
                        level6++;
                        title.prefix = (level2 === 0 ? '' : level2 + spliter) + (level3 === 0 ? '' : level3 + spliter) + (level4 === 0 ? '' : level4 + spliter) + (level5 === 0 ? '' : level5 + spliter) + level6 + spliter;
                        break;
                    default:
                        break;
                }
                matches = text.match(/([a-z-A-Z]+)/g);
                if (!matches) {
                    link = title.prefix.replace(/\./g, '-');
                    link = 'i-' + link.substr(0, link.length - 1);
                } else {
                    link = title.prefix.replace(/\./g, '-') + matches.join('-');
                }
                title.text = text;
                title.level = level;
                title.link = link;
                //                title.link = title.prefix + elem.getAttribute('id');
                titles.push(title);
                elem.setAttribute('id', title.link);
            });
        }
        createTree(titles);

    }

    function createTree(titles) {
        var buffer = '',
            container = document.getElementById('topic-list'),
            title,
            level,
            lastLevel = 0,
            nextLevel,
            i = 0,
            len = titles.length;
        if (len) {
            for (; i < len; i++) {
                title = titles[i];
                level = title.level;
                nextLevel = i + 1 < len ? titles[i + 1].level : 0;
                if (level > lastLevel) {
                    buffer += '<ul>\n';
                }
                buffer += '<li><a href="#' + title.link + '"><i>' + title.prefix + '</i><span>' + title.text + '</span></a></li>\n';
                if (level > nextLevel) {
                    buffer += '</ul>\n';
                }
                if (level === 2) {
                    lastLevel = 2;
                } else {
                    lastLevel = level;
                }
            }
            container = container.firstChild;
            while (container) {
                if (container.nodeType === 1 && container.tagName.toLocaleLowerCase() === 'div') {
                    break;
                } else {
                    container = container.nextSibling;
                }
            }
            container.innerHTML = buffer;

        } else {
            if (container) {
                container.parentNode.removeChild(container);
            }
        }

    }


    ready(function () {
        detect();

        var elem = $('#topic-list'),
            oldLoad,
            stick,
            nativeSpy,
            ghostSpy;

        if (elem && elem.length) {

            stick = sticky(elem, {
                top: 30
            }, function (sticky) {

                if (sticky) {
                    // startSticky
                    if (nativeSpy) {
                        nativeSpy.destroy();
                        nativeSpy = null;
                    }
                    ghostSpy = scrollSpy(this.ghost.find('.topic-tree'));
                } else {
                    // stopSticky
                    if (ghostSpy) {
                        ghostSpy.destroy();
                        ghostSpy = null;
                    }
                    nativeSpy = scrollSpy($('#topic-list').find('.topic-tree'));
                }
            });

            oldLoad = window.onload;
            window.onload = function () {
                stick.adjust();
                if (oldLoad) {
                    oldLoad();
                }
            };

        }

    });


})(window);