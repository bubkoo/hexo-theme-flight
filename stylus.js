// C:\Users\linn\AppData\Roaming\npm\node_modules\hexo\lib\plugins\renderer\stylus.js

var stylus = require('stylus'),
  nib = require('nib');

var cleanCSS = require('clean-css');

var getProperty = function(obj, key) {
  key = key.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');

  var split = key.split('.'),
    result = obj[split[0]];

  for (var i = 1, len = split.length; i < len; i++) {
    result = result[split[i]];
  }

  return result;
};

var defineConfig = function(style) {
  style.define('hexo-config', function(data) {
    return getProperty(hexo._themeConfig, data.val);
  });
};

module.exports = function(data, options, callback) {
  stylus(data.text)
    .use(nib())
    .use(defineConfig)
    .set('filename', data.path)
    .set('compress', true)
    .render(function(err, css) {
      var compressed = new cleanCSS().minify(css);
      if (callback) {
        callback(err, compressed);
      }
    });
};