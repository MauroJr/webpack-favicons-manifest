'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.raw = undefined;
exports.default = Favicons;

var _loaderUtils = require('loader-utils');

var _loaderUtils2 = _interopRequireDefault(_loaderUtils);

var _favicons = require('./favicons');

var faviconsModule = _interopRequireWildcard(_favicons);

var _cache = require('./cache');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const { favicons } = faviconsModule;

function Favicons(content) {
  const self = this;

  if (self.cacheable) {
    self.cacheable();
  }

  if (!self.emitFile) throw new Error('emitFile is required from module system');
  if (!self.async) throw new Error('async is required');

  const callback = self.async();
  const query = _loaderUtils2.default.parseQuery(self.query);
  const pathPrefix = _loaderUtils2.default.interpolateName(self, query.outputFilePrefix, {
    content,
    context: query.context || this.options.context,
    regExp: query.regExp
  });
  const fileHash = _loaderUtils2.default.interpolateName(self, '[hash]', {
    content,
    context: query.context || this.options.context,
    regExp: query.regExp
  });
  const cacheFile = pathPrefix + '.cache';

  (0, _cache.loadIconsFromDiskCache)(self, query, cacheFile, fileHash, (err, cachedResult) => {
    if (err) {
      return callback(err);
    }

    if (cachedResult) {
      return callback(null, 'module.exports = ' + JSON.stringify(cachedResult));
    }
    // Generate icons
    generateIcons(self, content, pathPrefix, query, (err, iconResult) => {
      if (err) {
        return callback(err);
      }

      (0, _cache.emitCacheInformationFile)(self, query, cacheFile, fileHash, iconResult);
      callback(null, 'module.exports = ' + JSON.stringify(iconResult));
    });
  });
}

function getPublicPath(compilation) {
  let publicPath = compilation.outputOptions.publicPath || '';
  if (publicPath.length && publicPath.substr(-1) !== '/') {
    publicPath += '/';
  }
  return publicPath;
}

function generateIcons(loader, imageFileStream, pathPrefix, query, callback) {
  const publicPath = getPublicPath(loader._compilation);
  favicons(imageFileStream, {
    path: '',
    url: '',
    icons: query.icons,
    background: query.background,
    appName: query.appName
  }, (err, result) => {
    if (err) {
      return callback(err);
    }

    const html = result.html.filter(entry => entry.indexOf('manifest') === -1).map(entry => entry.replace(/(href=[""])/g, '$1' + publicPath + pathPrefix));

    const loaderResult = {
      html,
      outputFilePrefix: pathPrefix,
      files: []
    };

    result.images.forEach(image => {
      loaderResult.files.push(pathPrefix + image.name);
      loader.emitFile(pathPrefix + image.name, image.contents);
    });

    result.files.forEach(file => {
      loaderResult.files.push(pathPrefix + file.name);
      loader.emitFile(pathPrefix + file.name, file.contents);
    });

    callback(null, loaderResult);
  });
}

const raw = exports.raw = true;