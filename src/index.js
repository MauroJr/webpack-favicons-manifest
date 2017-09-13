import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import childCompiler from './compiler';

export default function FaviconsManifestWebpackPlugin(opts) {
  let options = opts;

  if (typeof opts === 'string') {
    options = { iconSource: opts };
  }
  assert(typeof options === 'object', 'FaviconsManifestWebpackPlugin options are required');
  assert(options.iconSource, 'An input file is required');

  this.options = Object.assign({
    prefix: 'icons-[hash]/',
    emitStats: false,
    statsFilename: 'iconstats-[hash].json',
    persistentCache: true,
    inject: true,
    favicons: {}
  }, options);

  this.options.favicons = Object.assign({
    background: '#fff',
    icons: {}
  }, this.options.favicons);

  this.options.favicons.icons = Object.assign({
    android: true,
    appleIcon: true,
    appleStartup: true,
    coast: false,
    favicons: true,
    firefox: false,
    opengraph: false,
    twitter: false,
    yandex: false,
    windows: true
  }, this.options.favicons.icons);
}

FaviconsManifestWebpackPlugin.prototype.apply = function apply(compiler) {
  const self = this;
  const packageJson = parsePackageJson();
  const { favicons } = self.options;
  const {
    appName,
    appDescription,
    developerName,
    developerURL
  } = favicons;

  if (!appName) {
    favicons.appName = packageJson.name || 'My PWA';
  }

  if (!appDescription) {
    favicons.appDescription = packageJson.description || 'My Awesome PWA';
  }

  if (!developerName) {
    favicons.developerName = packageJson.author || '';
  }

  if (!developerURL) {
    favicons.developerURL = packageJson.repository || '';
  }

  // Generate the favicons
  let compilationResult;

  compiler.plugin('make', (compilation, callback) => {
    childCompiler.compileTemplate(self.options, compiler.context, compilation)
      .then((result) => {
        compilationResult = result;
        callback();
      })
      .catch(callback);
  });

  // Hook into the html-webpack-plugin processing
  // and add the html
  if (self.options.inject) {
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('html-webpack-plugin-before-html-processing', (htmlPluginData, callback) => {
        if (htmlPluginData.plugin.options.favicons !== false) {
          htmlPluginData.html = htmlPluginData.html.replace(
            /(<\/head>)/i,
            compilationResult.stats.html.join('') + '$&'
          );
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


function parsePackageJson(compilerWorkingDirectory) {
  let packageJson = path.resolve(compilerWorkingDirectory, 'package.json');
  if (!fs.existsSync(packageJson)) {
    packageJson = path.resolve(compilerWorkingDirectory, '../package.json');
    if (!fs.existsSync(packageJson)) {
      return {};
    }
  }

  return JSON.parse(fs.readFileSync(packageJson));
}
