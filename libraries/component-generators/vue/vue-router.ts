import { ComponentAssemblyLine, Builder } from '../pipeline'

import { createPlugin as createRouterPlugin } from '../pipeline/plugins/vue/vue-router'
import { createPlugin as createImportPlugin } from '../pipeline/plugins/common/import-statements'

import { GeneratorOptions } from '../pipeline/types'
import { ProjectUIDL } from '../../uidl-definitions/types'

import standardMapping from '../elements-mapping.json'
import vueMapping from './elements-mapping.json'

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

  const componentGenerator = async (uidl: any, options?: GeneratorOptions) => {
    const result = await asemblyLine.run(uidl, options)
    const code = chunksLinker.link(result.chunks)

    return {
      code,
      dependencies: result.dependencies,
    }
  }

  return componentGenerator
}

export default createVuePipeline
