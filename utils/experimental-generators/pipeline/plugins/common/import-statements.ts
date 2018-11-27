import { ComponentPlugin, ComponentPluginFactory } from '../../types'

import {
  makeDefaultImportStatement,
  makeNamedMappedImportStatement,
  makeNamedImportStatement,
} from '../../utils/js-ast'

interface ImportPluginConfig {
  importChunkName: string
}

const resolveImportStatement = (componentName: string, dependency: any) => {
  const details =
    dependency.meta && dependency.meta.path
      ? dependency.meta
      : {
          // default meta, this will probably change later
          path: './' + componentName,
        }

  if (details.namedImport) {
    // if the component is listed under a different originalName, then import is "x as y"
    return details.originalName
      ? makeNamedMappedImportStatement(
          { [details.originalName]: componentName },
          details.path
        )
      : makeNamedImportStatement([componentName], details.path)
  }

  return makeDefaultImportStatement(componentName, details.path)
}

export const createPlugin: ComponentPluginFactory<ImportPluginConfig> = (config) => {
  const { importChunkName = 'import' } = config || {}

  const importPlugin: ComponentPlugin = async (structure) => {
    const { dependencies } = structure

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
