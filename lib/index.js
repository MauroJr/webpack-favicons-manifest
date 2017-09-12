'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = FaviconsWebpackPlugin;

var _assert = require('assert');

var assert = _interopRequireWildcard(_assert);

var _fs = require('fs');

var fs = _interopRequireWildcard(_fs);

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _compiler = require('./compiler');

var _compiler2 = _interopRequireDefault(_compiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function FaviconsWebpackPlugin(opts) {
  let options = opts;

  if (typeof opts === 'string') {
    options = { logo: opts };
  }
  assert(typeof options === 'object', 'FaviconsWebpackPlugin options are required');
  assert(options.logo, 'An input file is required');
  this.options = Object.assign({
    prefix: 'icons-[hash]/',
    emitStats: false,
    statsFilename: 'iconstats-[hash].json',
    persistentCache: true,
    inject: true,
    background: '#fff'
  }, options);
  this.options.icons = Object.assign({
    android: true,
    appleIcon: true,
    appleStartup: true,
    coast: false,
    favicons: true,
    firefox: true,
    opengraph: false,
    twitter: false,
    yandex: false,
    windows: false
  }, this.options.icons);
}

FaviconsWebpackPlugin.prototype.apply = function apply(compiler) {
  const self = this;

  if (!self.options.title) {
    self.options.title = guessAppName(compiler.context);
  }

  // Generate the favicons
  let compilationResult;

  compiler.plugin('make', (compilation, callback) => {
    _compiler2.default.compileTemplate(self.options, compiler.context, compilation).then(result => {
      compilationResult = result;
      callback();
    }).catch(callback);
  });

  // Hook into the html-webpack-plugin processing
  // and add the html
  if (self.options.inject) {
    compiler.plugin('compilation', compilation => {
      compilation.plugin('html-webpack-plugin-before-html-processing', (htmlPluginData, callback) => {
        if (htmlPluginData.plugin.options.favicons !== false) {
          htmlPluginData.html = htmlPluginData.html.replace(/(<\/head>)/i, compilationResult.stats.html.join('') + '$&');
        }
        callback(null, htmlPluginData);
      });
    });
  }

  // Remove the stats from the output if they are not required
  if (!self.options.emitStats) {
    compiler.plugin('emit', (compilation, callback) => {
      delete compilation.assets[compilationResult.outputName];
      callback();
    });
  }
};

/**
 * Tries to guess the name from the package.json
 */
function guessAppName(compilerWorkingDirectory) {
  let packageJson = path.resolve(compilerWorkingDirectory, 'package.json');
  if (!fs.existsSync(packageJson)) {
    packageJson = path.resolve(compilerWorkingDirectory, '../package.json');
    if (!fs.existsSync(packageJson)) {
      return 'Webpack App';
    }
  }
  return JSON.parse(fs.readFileSync(packageJson)).name;
}
module.exports = exports['default'];