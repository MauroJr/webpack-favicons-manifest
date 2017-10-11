[![travis build](https://img.shields.io/travis/MY_GITHUB_USER/webpack-favicons-manifest.svg?style=flat)](https://travis-ci.org/MY_GITHUB_USER/webpack-favicons-manifest)
  [![Dependency Status](https://david-dm.org/MY_GITHUB_USER/webpack-favicons-manifest.svg?theme=shields.io)](https://david-dm.org/MY_GITHUB_USER/webpack-favicons-manifest)
  [![devDependency Status](https://david-dm.org/MY_GITHUB_USER/webpack-favicons-manifest/dev-status.svg?theme=shields.io)](https://david-dm.org/MY_GITHUB_USER/webpack-favicons-manifest#info=devDependencies)
  [![Codecov](https://img.shields.io/codecov/c/github/MY_GITHUB_USER/webpack-favicons-manifest.svg)]()
  [![MIT License](https://img.shields.io/github/license/MY_GITHUB_USER/webpack-favicons-manifest.svg?style=flat)](http://opensource.org/licenses/MIT)
  [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat)](https://github.com/semantic-release/semantic-release)


  Basic Usage
-----------
Add the plugin to your webpack config as follows:

```javascript
const FaviconsManifestWebpackPlugin = require('favicons-webpack-plugin')

...

plugins: [
  new FaviconsManifestWebpackPlugin('my-logo.png')
]
```

