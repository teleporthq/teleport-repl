import { File, Folder, ProjectGeneratorOptions } from '../../types'
import { computeFileName, extractExternalDependencies } from '../../utils/generator-utils'

import createVueGenerator from '../../../component-generators/vue/vue-component'
import nuxtMapping from './elements-mapping.json'
import customMapping from './custom-mapping.json'

const generateComponent = createVueGenerator({
  customMapping: { ...nuxtMapping, ...customMapping },
})

export default async (
  jsDoc: any,
  { sourcePackageJson, distPath }: ProjectGeneratorOptions = {
    distPath: 'dist',
  }
) => {
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
    name: distPath,
    files: [],
    subFolders: [pagesFolder, componentsFolder],
  }

  let collectedDependencies = {}

  // Handling the route component which specifies which components are pages
  const { states } = root
  for (const key of Object.keys(states)) {
    const currentState = states[key]
    const pageComponent = currentState.component

    const pageResult = await generateComponent(pageComponent, {
      localDependenciesPrefix: '../components/',
    })

    collectedDependencies = { ...collectedDependencies, ...pageResult.dependencies }

    pagesFolder.files.push({
      name: computeFileName(key, currentState),
      content: pageResult.code,
      extension: '.vue',
    })
  }

  // The rest of the components are written in components
  for (const componentName of Object.keys(components)) {
    const component = components[componentName]
    const componentResult = await generateComponent(component)
    collectedDependencies = { ...collectedDependencies, ...componentResult.dependencies }

    const file: File = {
      name: component.name,
      extension: '.vue',
      content: componentResult.code,
    }

    componentsFolder.files.push(file)
  }

  // Package.json
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
