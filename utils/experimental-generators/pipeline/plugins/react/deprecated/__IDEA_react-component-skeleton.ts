import { makeProgramBody } from '../../../utils/js-ast'

import { ComponentPlugin, ComponentPluginFactory } from '../../../types'

interface ReactComponentSkeletonConfig {
  strcutureChunkName: string
}
export const factory: ComponentPluginFactory<ReactComponentSkeletonConfig> = (config) => {
  const { strcutureChunkName = 'react-component-skeleton' } = config || {}

  const reactComponentSkeleton: ComponentPlugin = async (structure) => {
    const imports: any[] = []
    const declarations: any[] = []
    const exportDeclarations: any[] = []

    structure.chunks.push({
      type: 'skeleton',
      name: strcutureChunkName,
      linker: {
        slots: {
          imports: (chunks) => {
            imports.push(...chunks)
          },
          exports: (chunks) => {
            exportDeclarations.push(...chunks)
          },
          declarations: (chunks) => {
            declarations.push(...chunks)
          },
        },
      },
      content: () => {
        makeProgramBody([...imports, ...declarations, ...exportDeclarations])
      },
    })
    return structure
  }

  return reactComponentSkeleton
}

export default factory()
