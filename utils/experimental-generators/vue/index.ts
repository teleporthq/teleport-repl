import ComponentAsemblyLine from '../pipeline/asembly-line'
import htmlMapping from '../element-mappings/html'

import { createPlugin as vueBaseComponent } from '../pipeline/plugins/vue/vue-base-component'
import { createPlugin as vueStyleComponent } from '../pipeline/plugins/vue/vue-style-chunk'

import Builder from '../pipeline/builder'

const asemblyLine = new ComponentAsemblyLine(
  [vueBaseComponent(), vueStyleComponent()],
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
