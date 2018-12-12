import { ComponentDependency } from '../../uidl-definitions/types'

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
