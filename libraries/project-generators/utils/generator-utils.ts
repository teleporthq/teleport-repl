import { ComponentDependency } from '../../component-generators/pipeline/types'

// Especially useful for nuxt/next generators where the file name will dictate the url
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

export const extractExternalDependencies = (
  dependencies: Record<string, ComponentDependency>
) => {
  return Object.keys(dependencies)
    .filter((key) => {
      return dependencies[key].type !== 'local'
    })
    .reduce((acc: any, key) => {
      const depInfo = dependencies[key]
      if (depInfo.path) {
        acc[depInfo.path] = depInfo.version
      }

      return acc
    }, {})
}
