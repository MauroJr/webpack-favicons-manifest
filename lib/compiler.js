'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = childCompiler;

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

var _SingleEntryPlugin2 = _interopRequireDefault(_SingleEntryPlugin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function childCompiler(options, context, compilation) {
  // The entry file is just an empty helper as the dynamic template
  // require is added in "loader.js"
  const outputOptions = {
    filename: options.statsFilename,
    publicPath: compilation.outputOptions.publicPath
  };
  // Create an additional child compiler which takes the template
  // and turns it into an Node.JS html factory.
  // This allows us to use loaders during the compilation
  const compilerName = getCompilerName(context, outputOptions.filename);
  const compiler = compilation.createChildCompiler(compilerName, outputOptions);
  compiler.context = context;
  compiler.apply(new _SingleEntryPlugin2.default(context, '!!' + require.resolve('./favicons-manifest.js') + '?' + JSON.stringify({
    outputFilePrefix: options.prefix,
    persistentCache: options.persistentCache,
    favicons: options.favicons
  }) + '!' + options.iconSource));

  // Fix for "Uncaught TypeError: __webpack_require__(...) is not a function"
  // Hot module replacement requires that every child compiler has its own
  // cache. @see https://github.com/ampedandwired/html-webpack-plugin/pull/179
  compiler.plugin('compilation', compilation => {
    if (compilation.cache) {
      if (!compilation.cache[compilerName]) {
        compilation.cache[compilerName] = {};
      }
      compilation.cache = compilation.cache[compilerName];
    }
    compilation.plugin('optimize-chunk-assets', (chunks, callback) => {
      if (!chunks[0]) {
        return callback(compilation.errors[0] || 'Favicons generation failed');
      }
      const resultFile = chunks[0].files[0];
      const resultCode = compilation.assets[resultFile].source();
      let resultJson;
      try {
        /* eslint no-eval:0 */
        const result = eval(resultCode);
        resultJson = JSON.stringify(result);
      } catch (e) {
        return callback(e);
      }
      compilation.assets[resultFile] = {
        source: () => resultJson,
        size: () => resultJson.length
      };
      callback(null);
    });
  });

  // Compile and return a promise
  return new Promise((resolve, reject) => {
    compiler.runAsChild((err, entries, childCompilation) => {
      if (err) {
        return reject(err);
      }
      // Replace [hash] placeholders in filename
      const outputName = compilation.mainTemplate.applyPluginsWaterfall('asset-path', outputOptions.filename, {
        hash: childCompilation.hash,
        chunk: entries[0]
      });
      // Resolve / reject the promise
      if (childCompilation && childCompilation.errors && childCompilation.errors.length) {
        const errorDetails = childCompilation.errors.map(error => error.message + (error.error ? ':\n' + error.error : '')).join('\n');

        reject(new Error('Child compilation failed:\n' + errorDetails));
      } else if (err) {
        reject(err);
      } else {
        resolve({
          outputName,
          stats: JSON.parse(childCompilation.assets[outputName].source())
        });
      }
    });
  });
}

/**
 * Returns the child compiler name e.g. 'html-webpack-plugin for "index.html"'
 */
function getCompilerName(context, filename) {
  const absolutePath = path.resolve(context, filename);
  const relativePath = path.relative(context, absolutePath);
  return 'favicons-webpack-plugin for "' + (absolutePath.length < relativePath.length ? absolutePath : relativePath) + '"';
}
module.exports = exports['default'];