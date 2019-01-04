import { ComponentDependency, StateDefinition } from '../../uidl-definitions/types'

// Especially useful for nuxt/next generators where the file name will dictate the url
// In case the default flag is set, the file is set as index
export const computeFileName = (stateKey: string, stateBranch: any) => {
  if (stateBranch.default) {
    return 'index'
  }

  if (!stateBranch.meta || !stateBranch.meta.url) {
    // tslint:disable-next-line:no-console
    console.warn(
      `State node "${stateKey}" did not specify any meta url attribute. Assuming filename: "${stateKey}"`
    )
    return stateKey
  } else {
    return stateBranch.meta.url
  }
}

/**
 * A couple of different cases which need to be handled
 * In case of next/nuxt generators, the file names represent the urls of the pages
 * Also the root path needs to be represented by the index file
 */
export const extractPageMetadata = (
  routerDefinitions: StateDefinition,
  stateName: string,
  options: { usePathAsFileName?: boolean } = {
    usePathAsFileName: false,
  }
): { fileName: string; componentName: string } => {
  const defaultPage = routerDefinitions.defaultValue
  const pageDefinitions = routerDefinitions.values || []
  const pageDefinition = pageDefinitions.find((stateDef) => stateDef.value === stateName)

  if (!pageDefinition || !pageDefinition.meta) {
    return {
      fileName: stateName === defaultPage ? 'index' : stateName,
      componentName: stateName,
    }
  }

  const componentName = pageDefinition.meta.componentName || stateName
  const fileNameFromMeta = options.usePathAsFileName
    ? pageDefinition.meta.path && pageDefinition.meta.path.slice(1)
    : pageDefinition.meta.fileName

  return {
    fileName: stateName === defaultPage ? 'index' : fileNameFromMeta || stateName,
    componentName,
  }
}

// Only package dependencies are needed for the package.json file
export const extractExternalDependencies = (
  dependencies: Record<string, ComponentDependency>
) => {
  return Object.keys(dependencies)
    .filter((key) => {
      return dependencies[key].type === 'package'
    })
    .reduce((acc: any, key) => {
      const depInfo = dependencies[key]
      if (depInfo.path) {
        acc[depInfo.path] = depInfo.version
      }

      return acc
    }, {})
}
