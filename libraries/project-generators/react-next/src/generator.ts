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
  // tslint:disable-next-line:forin
  for (const stateKey in states) {
    const state = states[stateKey]

    const compiledComponent = await componentGenerator(state.component, {
      localDependenciesPrefix: '../components/',
      customMapping: { ...nextMapping, ...customMapping },
    })
    const fileName = state.meta && state.meta.url ? state.meta.url : stateKey
    pagesFolder.files.push({
      name: state.default ? `index` : fileName.toLowerCase(),
      extension: '.js',
      content: compiledComponent.code,
    })

    allDependencies = {
      ...allDependencies,
      ...compiledComponent.dependencies,
    }
  }

  // tslint:disable-next-line:forin
  for (const componentKey in components) {
    const comp = components[componentKey]

    try {
      const compiledComponent = await componentGenerator(comp, {
        customMapping: { ...nextMapping, ...customMapping },
      })
      componentsFolder.files.push({
        name: comp.name,
        extension: '.js',
        content: compiledComponent.code,
      })

      allDependencies = {
        ...allDependencies,
        ...compiledComponent.dependencies,
      }
    } catch (err) {
      console.error(componentKey, err)
    }
  }

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
