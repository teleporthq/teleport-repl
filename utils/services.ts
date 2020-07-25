import { BASE_URL } from './constants'
import { wrap } from 'comlink'
import { GeneratedFile } from '@teleporthq/teleport-types'
// @ts-ignore
import BundlerWorker from './workers/bundler.worker'

export const fetchJSONDataAndLoad = async (uidlLink: string) => {
  const result = await fetch(`${BASE_URL}fetch-uidl/${uidlLink}`)
  if (result.status !== 200) {
    throw new Error(result.statusText)
  }

  const jsonData = await result.json()
  return jsonData.uidl
}

export const uploadUIDLJSON = async (uidl: any) => {
  const response = await fetch(`${BASE_URL}upload-uidl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uidl,
    }),
  })
  return response.json()
}

export const bundler = async (jsFile: GeneratedFile) => {
  const worker = new BundlerWorker()
  const workerApi = wrap<import('./workers/bundler.worker').BundlerTypes>(worker)
  const { bundle } = workerApi
  try {
    const result = await bundle(jsFile)
    if (!result) {
      console.error('Failed in bundling')
    }
    const existingIframe = document.getElementById('output-iframe')
    existingIframe?.remove()

    const iframe = document.createElement('iframe')
    Object.assign(iframe.style, {
      margin: '0',
      padding: '0',
      borderStyle: 'none',
      height: '100%',
      width: '100%',
      marginBottom: '-5px',
      overflow: 'scroll',
    })
    const blob = URL.createObjectURL(
      new Blob(
        [
          `
  <script type="module">
  ${result}
  </script>
  <body>
  <div id="output">
  </div>
  </body>
  `,
        ],
        { type: 'text/html' }
      )
    )
    iframe.src = blob
    iframe.setAttribute('id', 'output-iframe')
    document.getElementById('render-output')?.append(iframe)
  } catch (e) {
    const elm = document.getElementById('render-output')
    if (elm) {
      elm.innerHTML = e
    }
  }
}
