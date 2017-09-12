'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.emitCacheInformationFile = emitCacheInformationFile;
exports.loadIconsFromDiskCache = loadIconsFromDiskCache;

var _fs = require('fs');

var fs = _interopRequireWildcard(_fs);

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _crypto = require('crypto');

var crypto = _interopRequireWildcard(_crypto);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const pluginVersion = require('../package.json').version;

/**
 * Stores the given iconResult together with the control hashes as JSON file
 */
/**
 * @file this file is responsible for the persitance disk caching
 * it offers helpers to prevent recompilation of the favicons on
 * every build
 */
function emitCacheInformationFile(loader, query, cacheFile, fileHash, iconResult) {
  if (!query.persistentCache) {
    return;
  }
  loader.emitFile(cacheFile, JSON.stringify({
    hash: fileHash,
    version: pluginVersion,
    optionHash: generateHashForOptions(query),
    result: iconResult
  }));
}

/**
 * Checks if the given cache object is still valid
 */
function isCacheValid(cache, fileHash, query) {
  // Verify that the source file is the same
  return cache.hash === fileHash &&
  // Verify that the options are the same
  cache.optionHash === generateHashForOptions(query) &&
  // Verify that the favicons version of the cache maches this version
  cache.version === pluginVersion;
}

/**
 * Try to load the file from the disc cache
 */
function loadIconsFromDiskCache(loader, query, cacheFile, fileHash, callback) {
  // Stop if cache is disabled
  if (!query.persistentCache) return callback(null);
  const resolvedCacheFile = path.resolve(loader._compiler.parentCompilation.compiler.outputPath, cacheFile);

  fs.exists(resolvedCacheFile, exists => {
    if (!exists) return callback(null);
    fs.readFile(resolvedCacheFile, (err, content) => {
      if (err) return callback(err);
      let cache;
      try {
        cache = JSON.parse(content);
        // Bail out if the file or the option changed
        if (!isCacheValid(cache, fileHash, query)) {
          return callback(null);
        }
      } catch (e) {
        return callback(e);
      }
      callback(null, cache.result);
    });
  });
}

/**
 * Generates a md5 hash for the given options
 */
function generateHashForOptions(options) {
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify(options));
  return hash.digest('hex');
}