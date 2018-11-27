import ComponentAsemblyLine from '../pipeline/asembly-line'

import { createPlugin as vueBaseComponent } from '../pipeline/plugins/vue/vue-base-component'
import { createPlugin as vueStyleComponent } from '../pipeline/plugins/vue/vue-style-chunk'
// import { createPlugin as importStatements } from '../pipeline/plugins/common/import-statements'

import Builder from '../pipeline/builder'

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

const asemblyLine = new ComponentAsemblyLine('vue', [
  vueBaseComponent(),
  vueStyleComponent(),
])

const generateComponent = async (jsDoc: any) => {
  const chunksLinker = new Builder()
  const result = await asemblyLine.run(jsDoc, customMapping)
  return {
    code: chunksLinker.link(result.chunks),
    dependencies: result.dependencies,
  }
}

export { generateComponent }
