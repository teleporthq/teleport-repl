import { Folder, File, ProjectGeneratorOptions } from '../../types'
import {
  ProjectUIDL,
  ComponentDependency,
  ComponentUIDL,
} from '../../../uidl-definitions/types'

import { extractExternalDependencies } from '../../utils/generator-utils'

import createAssemblyLine, {
  ReactComponentFlavors,
} from '../../../component-generators/react/react-component'

import nextMapping from './elements-mapping.json'

const componentGenerator = createAssemblyLine({
  variation: ReactComponentFlavors.StyledJSX,
  customMapping: nextMapping,
})

export default async (jsDoc: ProjectUIDL, options: ProjectGeneratorOptions = {}) => {
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
    name: options.distPath || 'dist',
    files: [],
    subFolders: [pagesFolder, componentsFolder],
  }

  let allDependencies: Record<string, ComponentDependency> = {}

  // page compnents first
  const states = root.content.states
  const stateDefinitions = root.stateDefinitions
  if (!states || !stateDefinitions) {
    return
  }

  const routerDefinitions = stateDefinitions.router
  if (!routerDefinitions) {
    return
  }

  await Promise.all(
    states.map(async (stateBranch) => {
      const stateName = stateBranch.value
      const pageContent = stateBranch.content
      const pageDefinition = (routerDefinitions.values || []).find(
        (stateDef) => stateDef.value === stateName
      )

      if (typeof pageContent === 'string') {
        return
      }

      const pageComponent: ComponentUIDL = {
        content: pageContent,
        name:
          (pageDefinition && pageDefinition.meta && pageDefinition.meta.componentName) ||
          stateName,
      }

      try {
        const compiledComponent = await componentGenerator(pageComponent, {
          localDependenciesPrefix: '../components/',
        })

        const file: File = {
          name:
            (pageDefinition &&
              pageDefinition.meta &&
              pageDefinition.meta.path &&
              pageDefinition.meta.path.slice(1)) ||
            stateName,
          extension: '.js',
          content: compiledComponent.code,
        }

        allDependencies = {
          ...allDependencies,
          ...compiledComponent.dependencies,
        }

        pagesFolder.files.push(file)
      } catch (err) {
        console.error(stateName, err)
      }
    })
  )

  if (components) {
    await Promise.all(
      Object.keys(components).map(async (componentName) => {
        const component = components[componentName]

        try {
          const compiledComponent = await componentGenerator(component)
          const file: File = {
            name: component.name,
            extension: '.js',
            content: compiledComponent.code,
          }

          allDependencies = {
            ...allDependencies,
            ...compiledComponent.dependencies,
          }

          componentsFolder.files.push(file)
        } catch (err) {
          console.error(componentName, err)
        }
      })
    )
  }

  // Package.json
  const { sourcePackageJson } = options
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
