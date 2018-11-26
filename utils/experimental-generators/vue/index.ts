import ComponentAsemblyLine from '../pipeline/asembly-line'
import htmlMapping from '../element-mappings/html'

import {
  vueBasicLinker,
  vueComponentJSChunk,
  vueComponentStyleChunkPlugin,
  vueTemplateChunk,
  vueDynamicProps,
} from '../pipeline/plugins/vue'

import Builder from '../pipeline/builder'

const asemblyLine = new ComponentAsemblyLine(
  [
    vueTemplateChunk,
    vueComponentJSChunk,
    vueDynamicProps,
    vueComponentStyleChunkPlugin,
    // vueBasicLinker,
  ],
  (type) => {
    // Here we could select based on target (ex: react, next)
    const result = (htmlMapping as { [key: string]: any })[type]

    if (!result) {
      // If no mapping is found, use the type as the end value
      return {
        name: type,
      }
    }

    return result
  }
)

const generateComponent = async (jsDoc: any) => {
  const chunksLinker = new Builder()
  const result = await asemblyLine.run(jsDoc)
  return chunksLinker.link(result)
}

export { generateComponent }
