const withTypescript = require('@zeit/next-typescript')
const withCSS = require('@zeit/next-css')

module.exports = withTypescript(
  withCSS({
    webpack(config, options) {
      return config
    }
  })
)
