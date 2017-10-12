import loaderUtils from 'loader-utils';
import favicons from 'favicons';
import {
  loadIconsFromDiskCache,
  emitCacheInformationFile
} from './cache';

export default function Favicons(content) {
  const self = this;

  if (self.cacheable) {
    self.cacheable();
  }

  if (!self.emitFile) throw new Error('emitFile is required from module system');
  if (!self.async) throw new Error('async is required');

  const callback = self.async();
  const query = loaderUtils.parseQuery(self.query);
  const pathPrefix = loaderUtils.interpolateName(self, query.outputFilePrefix, {
    content,
    context: query.context || this.options.context,
    regExp: query.regExp
  });
  const fileHash = loaderUtils.interpolateName(self, '[hash]', {
    content,
    context: query.context || this.options.context,
    regExp: query.regExp
  });
  const cacheFile = pathPrefix + '.cache';

  loadIconsFromDiskCache(self, query, cacheFile, fileHash, (err, cachedResult) => {
    if (err) {
      return callback(err);
    }

    if (cachedResult) {
      return callback(null, 'module.exports = ' + JSON.stringify(cachedResult));
    }
    // Generate icons
    generateIcons(self, content, pathPrefix, query, fileHash, (err, iconResult) => {
      if (err) {
        return callback(err);
      }

      emitCacheInformationFile(self, query, cacheFile, fileHash, iconResult);
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

function generateIcons(loader, imageFileStream, pathPrefix, query, fileHash, callback) {
  const publicPath = getPublicPath(loader._compilation);

  query.favicons.path = publicPath + pathPrefix;
  favicons(imageFileStream, query.favicons, (err, result) => {
    if (err) {
      return callback(err);
    }

    const html = result.html.map((entry) => {
      if (/rel="manifest"/g.test(entry)) {
        return `<link rel="manifest" href="${publicPath}${fileHash}.manifest.json">`;
      }

      if (/name="msapplication-config"/g.test(entry)) {
        return `<meta name="msapplication-config" content="${publicPath}${fileHash}.browserconfig.xml">`;
      }

      return entry;
    });

    const loaderResult = {
      html,
      outputFilePrefix: pathPrefix,
      files: []
    };

    result.images.forEach((image) => {
      loaderResult.files.push(pathPrefix + image.name);
      loader.emitFile(pathPrefix + image.name, image.contents);
    });

    result.files.forEach((file) => {
      const fileName = `${fileHash}.${file.name}`;

      loaderResult.files.push(fileName);
      loader.emitFile(fileName, file.contents);
    });

    callback(null, loaderResult);
  });
}

export const raw = true;
