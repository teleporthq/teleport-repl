import ComponentAsemblyLine from '../../../../utils/experimental-generators/pipeline/asembly-line'

import { createPlugin as vueBaseComponent } from '../../../../utils/experimental-generators/pipeline/plugins/vue/vue-base-component'
import { createPlugin as vueStyleComponent } from '../../../../utils/experimental-generators/pipeline/plugins/vue/vue-style-chunk'
import { createPlugin as vueImportStatements } from '../../../../utils/experimental-generators/pipeline/plugins/vue/vue-import-statements'

import Builder from '../../../../utils/experimental-generators/pipeline/builder'

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

const createVuePipeline = () => {
  const assemblyLine = new ComponentAsemblyLine('vue', [
    vueBaseComponent(),
    vueStyleComponent(),
    vueImportStatements(),
  ])

  const chunksLinker = new Builder()

  const componentGenerator = async (componentUIDL) => {
    const result = await assemblyLine.run(componentUIDL, {
      customMappings: customMapping,
    })

    const code = chunksLinker.link(result.chunks)

    return {
      code,
      dependencies: result.dependencies,
    }
  }

  return componentGenerator
}

export default createVuePipeline
