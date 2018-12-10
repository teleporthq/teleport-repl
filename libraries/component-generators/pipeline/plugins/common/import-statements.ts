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

const addImportChunk = (
  chunks: any[],
  dependencies: any,
  newChunkName: string,
  fileId: string | null
) => {
  const importASTs = Object.keys(dependencies).map((key) =>
    makeGenericImportStatement(key, dependencies[key])
  )
  // must me always generated, even if empty, othwerwise references will not work
  // if (importASTs.length > 0) {
  chunks.push({
    type: 'js',
    name: newChunkName,
    meta: {
      fileId,
    },
    content: importASTs,
  })
  // }
}

interface ImportPluginConfig {
  importLibsChunkName?: string
  importPackagesChunkName?: string
  importLocalsChunkName?: string
}

export const createPlugin: ComponentPluginFactory<ImportPluginConfig> = (config) => {
  const {
    importLibsChunkName = 'import-libs',
    importPackagesChunkName = 'import-packages',
    importLocalsChunkName = 'import-local',
    fileId = null,
  } = config || {}

  const importPlugin: ComponentPlugin = async (structure, operations) => {
    const dependencies = operations.getDependencies()

    const libraryDependencies = groupDependenciesByPackage(dependencies, 'library')
    const packageDependencies = groupDependenciesByPackage(dependencies, 'package')
    const localDependencies = groupDependenciesByPackage(dependencies, 'local')

    addImportChunk(structure.chunks, libraryDependencies, importLibsChunkName, fileId)
    addImportChunk(structure.chunks, packageDependencies, importPackagesChunkName, fileId)
    addImportChunk(structure.chunks, localDependencies, importLocalsChunkName, fileId)

    return structure
  }

  return importPlugin
}

export default createPlugin()
