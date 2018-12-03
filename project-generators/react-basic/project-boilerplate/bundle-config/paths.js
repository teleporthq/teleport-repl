const path = require('path')

/**
 * Define various paths that the projects needs to take into account when bundling
 */
module.exports = {
  entryPath: path.resolve(__dirname, '../src/index.js'),
  distFolder: path.resolve(__dirname, '../dist'),
  htmlFile: path.resolve(__dirname, '../src/static/index.html')
}