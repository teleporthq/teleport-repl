const withTypescript = require('@zeit/next-typescript')
const compose = require('next-compose-plugins')
const CopyWebpackPlugin = require('copy-webpack-plugin')


module.exports = compose([
  withTypescript,
], {
  webpack(config, options) {
    config.plugins.push(
      new CopyWebpackPlugin(
        [
          {
            from: 'node_modules/monaco-editor/min/vs/**/*',
            to: __dirname + '/static'
          }
        ], { cache: true }
      )
    )

    return config
  }
})