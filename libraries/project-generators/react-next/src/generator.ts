import { Folder, File, ProjectUIDL, ProjectGeneratorOptions } from '../../types'
import { ComponentDependency } from '../../../component-generators/pipeline/types'

import { extractExternalDependencies } from '../../utils/generator-utils'

import createAssemblyLine, {
  ReactComponentFlavors,
} from '../../../component-generators/react/react-component'

import nextMapping from './elements-mapping.json'
import customMapping from './custom-mapping.json'

const componentGenerator = createAssemblyLine({
  variation: ReactComponentFlavors.StyledJSX,
})

export default async (
  jsDoc: ProjectUIDL,
  { sourcePackageJson, distPath = 'dist' }: ProjectGeneratorOptions = {
    distPath: 'dist',
  }
) => {
  // pick root name/id

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

  let allDependencies: Record<string, ComponentDependency> = {}

  // page compnents first
  const { states } = root

  const [...generatedPagesFromStates] = await Promise.all(
    Object.keys(states).map(async (stateName) => {
      const state = states[stateName]

      try {
        const compiledComponent = await componentGenerator(state.component, {
          localDependenciesPrefix: '../components/',
          customMapping: { ...nextMapping, ...customMapping },
        })

        const fileName = state.meta && state.meta.url ? state.meta.url : stateName

        const file: File = {
          name: state.default ? `index` : fileName.toLowerCase(),
          extension: '.js',
          content: compiledComponent.code,
        }

        allDependencies = {
          ...allDependencies,
          ...compiledComponent.dependencies,
        }

        return file
      } catch (err) {
        console.error(stateName, err)
        return null
      }
    })
  )

  pagesFolder.files.push(
    ...(generatedPagesFromStates.filter((file) => file !== null) as File[])
  )

  const [...generatedComponentFiles] = await Promise.all(
    Object.keys(components).map(async (componentName) => {
      const component = components[componentName]

      try {
        const compiledComponent = await componentGenerator(component, {
          customMapping: { ...nextMapping, ...customMapping },
        })
        const file: File = {
          name: component.name,
          extension: '.js',
          content: compiledComponent.code,
        }

        allDependencies = {
          ...allDependencies,
          ...compiledComponent.dependencies,
        }

        return file
      } catch (err) {
        console.error(componentName, err)
        return null
      }
    })
  )

  componentsFolder.files.push(
    ...(generatedComponentFiles.filter((file) => file !== null) as File[])
  )

  // Package.json
  if (sourcePackageJson) {
    const externalDep = extractExternalDependencies(allDependencies)
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
