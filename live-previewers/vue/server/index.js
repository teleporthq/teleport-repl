const express = require('express')
const path = require('path')
const fs = require('fs')
const consola = require('consola')
const bodyParser = require('body-parser')
const { Nuxt, Builder } = require('nuxt')
const app = express()
const host = process.env.HOST || '127.0.0.1'
const port = process.env.PORT || 3032

app.set('port', port)

// Import and Set Nuxt.js options
let config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')

async function start() {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }

  app.use(bodyParser.text())

  app.use((req, res, done) => {
    // doesn't send response just adjusts it
    res.header('Access-Control-Allow-Origin', '*') //* to give access to any origin
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization' //to give access to all the headers provided
    )
    if (req.method === 'OPTIONS') {
      res.header(
        'Access-Control-Allow-Methods',
        'PUT, POST, PATCH, DELETE, GET'
      ) //to give access to all the methods provided
      return res.status(200).json({})
    }
    done() //so that other routes can take over
  })

  app.post('/preview', (req, res) => {
    const rootDir = path.resolve(__dirname, '../.dynamic/')
    if (!fs.existsSync(rootDir)) {
      fs.mkdirSync(rootDir)
    }
    const dynamicPreviewDir = path.resolve(
      __dirname,
      '../.dynamic/PreviewedComponent/'
    )
    if (!fs.existsSync(dynamicPreviewDir)) {
      fs.mkdirSync(dynamicPreviewDir)
    }

    fs.writeFileSync(`${dynamicPreviewDir}/index.vue`, req.body)
    res.json({ ok: true, body: req.body })
  })

  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  app.listen(port, host)
  consola.ready({
    badge: true,
    message: `Server listening on http://${host}:${port}`
  })
}
start()
