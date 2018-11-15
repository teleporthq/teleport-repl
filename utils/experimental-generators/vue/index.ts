import ComponentAsemblyLine from '../pipeline/'

import {
  vueBasicLinker,
  vueComponentJSChunk,
  vueComponentStyleChunkPlugin,
  vueTemplateChunk,
} from '../pipeline/plugins/vue'

const asemblyLine = new ComponentAsemblyLine([
  vueTemplateChunk,
  vueComponentJSChunk,
  vueComponentStyleChunkPlugin,
  vueBasicLinker,
])

const generateComponent = async (jsDoc: any) => {
  const result = await asemblyLine.run(jsDoc)
  return result.chunks[result.chunks.length - 1].content
}

export { generateComponent }
