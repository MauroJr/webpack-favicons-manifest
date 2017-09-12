/**
 * @file this file is responsible for the persitance disk caching
 * it offers helpers to prevent recompilation of the favicons on
 * every build
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const pluginVersion = require('../package.json').version;

/**
 * Stores the given iconResult together with the control hashes as JSON file
 */
export function emitCacheInformationFile(loader, query, cacheFile, fileHash, iconResult) {
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
export function loadIconsFromDiskCache(loader, query, cacheFile, fileHash, callback) {
  // Stop if cache is disabled
  if (!query.persistentCache) return callback(null);
  const resolvedCacheFile = path.resolve(
    loader._compiler.parentCompilation.compiler.outputPath,
    cacheFile
  );

  fs.exists(resolvedCacheFile, (exists) => {
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
