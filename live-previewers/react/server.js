const express = require('express')
const next = require('next')
const fs = require('fs')
const path = require('path')
    
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const bodyParser = require('body-parser')

const port = process.argv[2]


app.prepare()
.then(() => {
  const server = express()

  server.use(bodyParser.text())

  server.use((req, res, done) => { //doesn't send response just adjusts it
    res.header("Access-Control-Allow-Origin", "*") //* to give access to any origin
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization" //to give access to all the headers provided
    );
    if(req.method === 'OPTIONS'){
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET'); //to give access to all the methods provided
        return res.status(200).json({});
    }
    done(); //so that other routes can take over
})
    
  server.post('/preview', (req, res) => {
    const rootDir = path.resolve(__dirname, './.dynamic/')
    if (!fs.existsSync(rootDir)){
      fs.mkdirSync(rootDir);
    }
    const dynamicPreviewDir = path.resolve(__dirname, './.dynamic/PreviewedComponent/')
    if (!fs.existsSync(dynamicPreviewDir)){
      fs.mkdirSync(dynamicPreviewDir);
    }
    fs.writeFileSync(`${dynamicPreviewDir}/index.js`, req.body)
    res.json({ok: true, body: req.body})
  })

  server.get('*', (req, res) => {
    return handle(req, res)
  })
    
  server.listen(port, (err) => {
    if (err) {
      throw err
    }
    
    // tslint:disable-next-line:no-console
    console.log(`> Ready on http://localhost:${port}`)
  })
})
.catch((ex) => {
  // tslint:disable-next-line:no-console
  console.error(ex.stack)
  process.exit(1)
})