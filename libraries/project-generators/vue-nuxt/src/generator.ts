import { File, Folder, ProjectGeneratorOptions } from '../../types'
import { computeFileName, extractExternalDependencies } from '../../utils/generator-utils'

import createVueGenerator from '../../../component-generators/vue/vue-component'
import nuxtMapping from './elements-mapping.json'
import customMapping from './custom-mapping.json'

const generateComponent = createVueGenerator({
  customMapping: { ...nuxtMapping, ...customMapping },
})

export default async (jsDoc: any, options: ProjectGeneratorOptions = {}) => {
  if (jsDoc.schema !== 'project') {
    // This will be updated to JSON Schema validation
    throw new Error('schema type is not project')
  }

  const { components, root } = jsDoc

  const pagesFolder: Folder = {
    name: 'pages',
    files: [],
    subFolders: [],
  }

  const componentsFolder: Folder = {
    name: 'components',
    files: [],
    subFolders: [],
  }

  const distFolder: Folder = {
    name: options.distPath || 'dist',
    files: [],
    subFolders: [pagesFolder, componentsFolder],
  }

  let collectedDependencies = {}

  // Handling the route component which specifies which components are pages
  const { states } = root
  const [...generatedPageFiles] = await Promise.all(
    Object.keys(states).map(async (stateKey) => {
      const currentState = states[stateKey]
      const pageComponent = currentState.component

      const pageResult = await generateComponent(pageComponent, {
        localDependenciesPrefix: '../components/',
      })

      collectedDependencies = { ...collectedDependencies, ...pageResult.dependencies }

      const file: File = {
        name: computeFileName(stateKey, currentState),
        content: pageResult.code,
        extension: '.vue',
      }

      return file
    })
  )

  pagesFolder.files.push(...generatedPageFiles)

  const [...generatedComponentFiles] = await Promise.all(
    Object.keys(components).map(async (componentName) => {
      const component = components[componentName]
      const componentResult = await generateComponent(component)
      collectedDependencies = {
        ...collectedDependencies,
        ...componentResult.dependencies,
      }

      const file: File = {
        name: component.name,
        extension: '.vue',
        content: componentResult.code,
      }
      return file
    })
  )

  componentsFolder.files.push(...generatedComponentFiles)

  // Package.json
  const { sourcePackageJson } = options
  if (sourcePackageJson) {
    const externalDep = extractExternalDependencies(collectedDependencies)
    sourcePackageJson.dependencies = {
      ...sourcePackageJson.dependencies,
      ...externalDep,
    }

    const packageFile: File = {
      name: 'package',
      extension: '.json',
      content: JSON.stringify(sourcePackageJson, null, 2),
    }

    distFolder.files.push(packageFile)
  }

  return distFolder
}
