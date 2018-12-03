// tslint:disable:no-console
import componentWithStates from '../../inputs/component-states'

import ComponentAsemblyLine from '../../utils/experimental-generators/pipeline/asembly-line'

import Builder from '../../utils/experimental-generators/pipeline/builder'

import { createPlugin as importStatements } from '../../utils/experimental-generators/pipeline/plugins/common/import-statements'

import { createPlugin as appComponentPlugin } from './pipeline/react-router-app'
import { configureAsemlyLine, ReactComponentFlavors } from './pipeline/react-component'

const componentGenerator = configureAsemlyLine({
  variation: ReactComponentFlavors.JSS,
})

const configureRouterAsemblyLine = () => {
  const configureAppRouterComponent = appComponentPlugin({
    componentChunkName: 'app-router-component',
    domRenderChunkName: 'app-router-export',
    importChunkName: 'import',
  })

  const configureImportStatements = importStatements({
    importLibsChunkName: 'import',
  })

  const generateComponent = async (jsDoc: any) => {
    const asemblyLine = new ComponentAsemblyLine('react', [
      configureAppRouterComponent,
      configureImportStatements,
    ])

    const result = await asemblyLine.run(jsDoc)

    const chunksLinker = new Builder()

    return {
      code: chunksLinker.link(result.chunks),
      dependencies: result.dependencies,
    }
  }

  return generateComponent
}

const routingComponentGenerator = configureRouterAsemblyLine()

// interface FileDescriptor {
//   type: 'file' | 'dir'
//   content: { [key: string]: FileDescriptor } | null | FileContent
// }

// interface FileContent {
//   code: null | string
// }

const processProjectUIDL = async (jsDoc: any) => {
  console.log('processing', jsDoc)

  const fileTree: any = {
    type: 'dir',
    content: {
      src: {
        type: 'dir',
        content: {
          components: {
            type: 'dir',
            content: {},
          },
        },
      },
      'package.json': {
        type: 'file',
        content: {},
      },
    },
  }
  // pick root name/id

  const { components, root } = jsDoc
  const keys = Object.keys(components)

  const srcDir = fileTree.content && fileTree.content.src && fileTree.content.src.content

  const compoenntsDir = srcDir && srcDir.components.content
  let allDependencies = {}
  // tslint:disable-next-line:forin
  for (const i in keys) {
    const key = keys[i]
    if (components[key].name === root) {
      try {
        const compiledComponent = await routingComponentGenerator(components[key])
        console.log(compiledComponent.code)
        srcDir.index = {
          type: 'file',
          name: `index.js`,
          content: {
            code: compiledComponent.code,
          },
        }

        allDependencies = {
          ...allDependencies,
          ...compiledComponent.dependencies,
        }
      } catch (err) {
        console.error(key, err)
      }
    } else {
      try {
        const compiledComponent = await componentGenerator(components[key])
        compoenntsDir[components[key].name] = {
          type: 'file',
          name: `${components[key].name}.js`,
          content: compiledComponent,
        }

        console.log(compiledComponent)

        allDependencies = {
          ...allDependencies,
          ...compiledComponent.dependencies,
        }
      } catch (err) {
        console.error(key, err)
      }
    }
  }

  console.log(fileTree, allDependencies)
}

processProjectUIDL(componentWithStates)
