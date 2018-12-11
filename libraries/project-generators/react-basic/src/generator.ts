import reactProjectMapping from './elements-mapping.json'
import customMapping from './custom-mapping.json'

import { configureRouterAsemblyLine } from '../../../component-generators/react/react-router'
import configureAssemblyLine, {
  ReactComponentFlavors,
} from '../../../component-generators/react/react-component'

import { extractExternalDependencies } from '../../utils/generator-utils'

import { File, Folder, ProjectGeneratorOptions } from '../../types'

const componentGenerator = configureAssemblyLine({
  variation: ReactComponentFlavors.CSSModules,
})

const routingComponentGenerator = configureRouterAsemblyLine()

export default async (
  jsDoc: any,
  { sourcePackageJson, distPath = 'dist' }: ProjectGeneratorOptions = {
    distPath: 'dist',
  }
) => {
  // pick root name/id

  const { components, root } = jsDoc
  const keys = Object.keys(components)

  const componentsFolder: Folder = {
    name: 'components',
    files: [],
    subFolders: [],
  }

  const srcFolder: Folder = {
    name: 'src',
    files: [],
    subFolders: [componentsFolder],
  }

  const distFolder: Folder = {
    name: distPath,
    files: [],
    subFolders: [srcFolder],
  }

  let allDependencies: Record<string, any> = {}

  // Handle the router first
  const routingComponent = await routingComponentGenerator(root)

  srcFolder.files.push({
    name: 'index',
    extension: '.js',
    content: routingComponent.code,
  })

  allDependencies = {
    ...allDependencies,
    ...routingComponent.dependencies,
  }

  // tslint:disable-next-line:forin
  for (const i in keys) {
    const key = keys[i]
    try {
      const compiledComponent = await componentGenerator(components[key], {
        customMapping: { ...reactProjectMapping, ...customMapping },
      })

      if (compiledComponent.css) {
        componentsFolder.files.push({
          name: components[key].name,
          extension: '.css',
          content: compiledComponent.css,
        })
      }

      componentsFolder.files.push({
        name: components[key].name,
        extension: '.js',
        content: compiledComponent.code,
      })

      allDependencies = {
        ...allDependencies,
        ...compiledComponent.dependencies,
      }
    } catch (err) {
      console.error(key, err)
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
