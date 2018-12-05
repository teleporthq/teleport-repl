import ComponentAsemblyLine from '../../../../utils/experimental-generators/pipeline/asembly-line'

import { createPlugin as vueBaseComponent } from '../../../../utils/experimental-generators/pipeline/plugins/vue/vue-base-component'
import { createPlugin as vueStyleComponent } from '../../../../utils/experimental-generators/pipeline/plugins/vue/vue-style-chunk'
import { createPlugin as vueImportStatements } from '../../../../utils/experimental-generators/pipeline/plugins/vue/vue-import-statements'

import Builder from '../../../../utils/experimental-generators/pipeline/builder'

const vueProjectMappings = {
  NavLink: {
    name: 'router-link',
    attrs: {
      to: '$attrs.transitionTo',
    },
  },
}

const createVuePipeline = (customMappings) => {
  const assemblyLine = new ComponentAsemblyLine(
    'vue',
    [vueBaseComponent(), vueStyleComponent(), vueImportStatements()],
    vueProjectMappings
  )

  const chunksLinker = new Builder()

  const componentGenerator = async (componentUIDL) => {
    const result = await assemblyLine.run(componentUIDL, {
      customMappings,
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
