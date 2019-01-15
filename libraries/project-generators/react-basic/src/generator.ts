import reactProjectMapping from './elements-mapping.json'
import customMapping from './custom-mapping.json'

import { configureRouterAsemblyLine } from '../../../component-generators/react/react-router'
import configureAssemblyLine, {
  ReactComponentFlavors,
} from '../../../component-generators/react/react-component'

import {
  extractExternalDependencies,
  extractPageMetadata,
  createManifestJSON,
} from '../../utils/generator-utils'

import { File, Folder, ProjectGeneratorOptions } from '../../types'
import { ProjectUIDL } from '../../../uidl-definitions/types'
import { createHtmlIndexFile } from './utils'

const componentGenerator = configureAssemblyLine({
  variation: ReactComponentFlavors.CSSModules,
})

const routingComponentGenerator = configureRouterAsemblyLine()

export default async (
  uidl: ProjectUIDL,
  { sourcePackageJson, distPath = 'dist' }: ProjectGeneratorOptions = {
    distPath: 'dist',
  }
) => {
  // pick root name/id

  const { components = {}, root } = uidl

  const componentsFolder: Folder = {
    name: 'components',
    files: [],
    subFolders: [],
  }

  const pagesFolder: Folder = {
    name: 'pages',
    files: [],
    subFolders: [],
  }

  const staticFolder: Folder = {
    name: 'static',
    files: [],
    subFolders: [],
  }

  const srcFolder: Folder = {
    name: 'src',
    files: [],
    subFolders: [componentsFolder, pagesFolder, staticFolder],
  }

  const distFolder: Folder = {
    name: distPath,
    files: [],
    subFolders: [srcFolder],
  }

  let allDependencies: Record<string, any> = {}
  const componentMappings = { ...reactProjectMapping, ...customMapping }

  const { states } = root.content
  const stateDefinitions = root.stateDefinitions
  if (!states || !stateDefinitions) {
    return distFolder
  }

  const routerDefinitions = stateDefinitions.router
  if (!routerDefinitions) {
    return distFolder
  }

  if (uidl.globals.manifest) {
    const manifestJSON = createManifestJSON(uidl.globals.manifest, uidl.name)
    const manifestFile: File = {
      name: 'manifest',
      extension: '.json',
      content: JSON.stringify(manifestJSON, null, 2),
    }

    staticFolder.files.push(manifestFile)
  }

  const htmlIndexContent = createHtmlIndexFile(uidl)
  if (htmlIndexContent) {
    const htmlFile: File = {
      name: 'index',
      extension: '.html',
      content: htmlIndexContent,
    }

    srcFolder.files.push(htmlFile)
  }

  // routing component (index.js)
  // TODO: Avoid leaky memory reference because the root is parsed once here and then each branch is parsed below
  const rootCopy = JSON.parse(JSON.stringify(root))
  const routingComponent = await routingComponentGenerator(rootCopy)

  srcFolder.files.push({
    name: 'index',
    extension: '.js',
    content: routingComponent.code,
  })

  allDependencies = {
    ...allDependencies,
    ...routingComponent.dependencies,
  }

  // pages
  await Promise.all(
    states.map(async (stateBranch) => {
      const { value: pageKey, content: pageContent } = stateBranch

      if (typeof pageKey !== 'string' || typeof pageContent === 'string') {
        return
      }

      const { componentName, fileName } = extractPageMetadata(routerDefinitions, pageKey)
      const pageComponent = {
        name: componentName,
        content: pageContent,
        meta: {
          fileName,
        },
      }

      const compiledComponent = await componentGenerator(pageComponent, {
        customMapping: componentMappings,
        localDependenciesPrefix: '../components/',
      })

      let cssFile: File | null = null
      if (compiledComponent.css) {
        cssFile = {
          name: fileName,
          extension: '.css',
          content: compiledComponent.css,
        }
      }

      const jsFile: File = {
        name: fileName,
        extension: '.js',
        content: compiledComponent.code,
      }

      allDependencies = {
        ...allDependencies,
        ...compiledComponent.dependencies,
      }

      if (cssFile) {
        pagesFolder.files.push(cssFile)
      }
      pagesFolder.files.push(jsFile)
    })
  )

  // components
  await Promise.all(
    Object.keys(components).map(async (componentName) => {
      const component = components[componentName]
      const compiledComponent = await componentGenerator(component, {
        customMapping: componentMappings,
      })

      let cssFile: File | null = null
      if (compiledComponent.css) {
        cssFile = {
          name: component.name,
          extension: '.css',
          content: compiledComponent.css,
        }
      }

      const jsFile: File = {
        name: component.name,
        extension: '.js',
        content: compiledComponent.code,
      }

      allDependencies = {
        ...allDependencies,
        ...compiledComponent.dependencies,
      }

      if (cssFile) {
        componentsFolder.files.push(cssFile)
      }
      componentsFolder.files.push(jsFile)
    })
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
