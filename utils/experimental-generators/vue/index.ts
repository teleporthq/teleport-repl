import ComponentAsemblyLine from '../pipeline/'
import htmlMapping from '../element-mappings/html'

import {
  vueBasicLinker,
  vueComponentJSChunk,
  vueComponentStyleChunkPlugin,
  vueTemplateChunk,
  vueDynamicProps,
} from '../pipeline/plugins/vue'

const asemblyLine = new ComponentAsemblyLine(
  [
    vueTemplateChunk,
    vueComponentJSChunk,
    vueDynamicProps,
    vueComponentStyleChunkPlugin,
    vueBasicLinker,
  ],
  (type) => {
    // Here we could select based on target (ex: react, next)
    const result = htmlMapping[type]

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
  const result = await asemblyLine.run(jsDoc)
  return result.chunks[result.chunks.length - 1].content
}

export { generateComponent }
