import { ComponentPlugin, ComponentPluginFactory } from '../../types'

import { resolveImportStatement } from '../../utils/js-ast'

interface ImportPluginConfig {
  importChunkName: string
}

export const createPlugin: ComponentPluginFactory<ImportPluginConfig> = (config) => {
  const { importChunkName = 'import' } = config || {}

  const importPlugin: ComponentPlugin = async (structure, operations) => {
    const dependencies = operations.getDependencies()

    // TODO: We need to merge imports that have the same path

    const importASTs = Object.keys(dependencies).map((key) =>
      resolveImportStatement(key, dependencies[key])
    )

    // TODO: Should we remove resolved dependencies from the code?

    if (importASTs.length <= 0) {
      return structure
    }

    structure.chunks.push({
      type: 'js',
      name: importChunkName,
      content: importASTs,
    })

    return structure
  }

  return importPlugin
}

export default createPlugin()
