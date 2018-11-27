import ComponentAsemblyLine from '../pipeline/asembly-line'
import htmlMapping from '../element-mappings/html'

import { createPlugin as vueBaseComponent } from '../pipeline/plugins/vue/vue-base-component'
import { createPlugin as vueStyleComponent } from '../pipeline/plugins/vue/vue-style-chunk'
// import { createPlugin as importStatements } from '../pipeline/plugins/common/import-statements'

import Builder from '../pipeline/builder'

const asemblyLine = new ComponentAsemblyLine(
  [vueBaseComponent(), vueStyleComponent()],
  (type) => {
    const customMapping = {
      Datepicker: {
        name: 'Datepicker',
        attrs: {
          'data-attr': 'test',
        },
        dependency: {
          type: 'package',
          meta: {
            path: 'vuejs-datepicker',
            version: '1.5.4',
            namedImport: false,
          },
        },
      },
    }

    const mapping = {
      ...htmlMapping,
      ...customMapping,
    }

    // Here we could select based on target (ex: react, next)
    const result = (mapping as { [key: string]: any })[type]

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
  return {
    code: chunksLinker.link(result.chunks),
    dependencies: result.dependencies,
  }
}

export { generateComponent }
