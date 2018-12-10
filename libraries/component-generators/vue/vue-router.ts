import { ComponentAssemblyLine, Builder } from '../pipeline'

import { createPlugin as createRouterPlugin } from '../pipeline/plugins/vue/vue-router'
import { createPlugin as createImportPlugin } from '../pipeline/plugins/common/import-statements'

import standardMapping from '../elements-mapping.json'
import vueMapping from './elements-mapping.json'

interface GeneratorOptions {
  localDependenciesPrefix?: string
  customMapping?: any
}

const createVuePipeline = ({ customMapping }: GeneratorOptions = {}) => {
  const asemblyLine = new ComponentAssemblyLine(
    [
      createRouterPlugin({
        codeChunkName: 'vue-router',
        importChunkName: 'import-lib',
      }),
      createImportPlugin({
        importLibsChunkName: 'import-lib',
      }),
    ],
    {
      ...standardMapping,
      ...vueMapping,
      ...customMapping,
    }
  )

  const chunksLinker = new Builder()

  const componentGenerator = async (componentUIDL: any) => {
    const result = await asemblyLine.run(componentUIDL)
    const code = chunksLinker.link(result.chunks)

    return {
      code,
      dependencies: result.dependencies,
    }
  }

  return componentGenerator
}

export default createVuePipeline
