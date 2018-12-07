import { ComponentPlugin, ComponentPluginFactory } from '../../types'

import { makeGenericImportStatement } from '../../utils/js-ast'

interface ImportDependency {
  identifier: string
  namedImport: boolean
  originalName: string
}

const groupDependenciesByPackage = (dependencies: any, packageType?: string) => {
  const result: { [key: string]: ImportDependency[] } = {}

  Object.keys(dependencies)
    .filter(
      (key) => (packageType && dependencies[key].type === packageType) || !packageType
    )
    .map((key) => {
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

const addImportChunk = (chunks: any[], dependencies: any, vueScriptChunkName: string) => {
  const scriptChunk = chunks.find((chunk) => chunk.name === vueScriptChunkName)

  const importASTs = Object.keys(dependencies).map((key) =>
    makeGenericImportStatement(key, dependencies[key])
  )
  if (importASTs.length > 0) {
    const scriptASTBody = scriptChunk.content.program.body
    scriptASTBody.unshift(...importASTs)
  }
}

interface ImportPluginConfig {
  vueScriptChunkName?: string
}

export const createPlugin: ComponentPluginFactory<ImportPluginConfig> = (config) => {
  const { vueScriptChunkName = 'vue-component-js-chunk' } = config || {}

  const importPlugin: ComponentPlugin = async (structure, operations) => {
    const dependencies = operations.getDependencies()

    const libraryDependencies = groupDependenciesByPackage(dependencies, 'library')
    const packageDependencies = groupDependenciesByPackage(dependencies, 'package')
    const localDependencies = groupDependenciesByPackage(dependencies, 'local')

    addImportChunk(structure.chunks, localDependencies, vueScriptChunkName)
    addImportChunk(structure.chunks, packageDependencies, vueScriptChunkName)
    addImportChunk(structure.chunks, libraryDependencies, vueScriptChunkName)

    return structure
  }

  return importPlugin
}

export default createPlugin()
