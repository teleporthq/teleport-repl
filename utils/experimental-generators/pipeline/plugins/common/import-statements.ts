import { ComponentPlugin, ComponentPluginFactory } from '../../types'

import { makeGenericImportStatement } from '../../utils/js-ast'

interface ImportDependency {
  identifier: string
  namedImport: boolean
  originalName: string
}

const groupDependenciesByPackage = (dependencies: any) => {
  const result: { [key: string]: ImportDependency[] } = {}

  Object.keys(dependencies).map((key) => {
    const dep = dependencies[key]
    const packagePath = dep.meta.path

    if (!result[packagePath]) {
      result[packagePath] = [] // Initialize the dependencies from this path
    }

    result[packagePath].push({
      identifier: key,
      namedImport: !!dep.meta.namedImport,
      originalName: dep.meta.originalName || key,
    })
  })

  return result
}

interface ImportPluginConfig {
  importChunkName: string
}

export const createPlugin: ComponentPluginFactory<ImportPluginConfig> = (config) => {
  const { importChunkName = 'import' } = config || {}

  const importPlugin: ComponentPlugin = async (structure, operations) => {
    const dependencies = operations.getDependencies()
    const groupedDependencies = groupDependenciesByPackage(dependencies)
    const importASTs = Object.keys(groupedDependencies).map((key) =>
      makeGenericImportStatement(key, groupedDependencies[key])
    )

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
