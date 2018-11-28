// tslint:disable:no-console

import componentWithStates from '../../../inputs/component-states'

import ComponentAsemblyLine from '../pipeline/asembly-line'
import Builder from '../pipeline/builder'

import { createPlugin as appComponentPlugin } from './pipeline/react-router-app'

import { configureAsemlyLine, ReactComponentFlavors } from './react-component-pipeline'

const componentGenerator = configureAsemlyLine({
  variation: ReactComponentFlavors.JSS,
})

const configureRouterAsemblyLine = () => {
  const configureAppRouterComponent = appComponentPlugin({
    componentChunkName: 'app-router-component',
    exportChunkName: 'app-router-export',
  })

  const generateComponent = async (jsDoc: any) => {
    const asemblyLine = new ComponentAsemblyLine('react', [configureAppRouterComponent])

    const result = await asemblyLine.run(jsDoc)
    console.log(result)

    // const chunksLinker = new Builder()

    return {
      // code: chunksLinker.link(result.chunks),
      dependencies: result.dependencies,
    }
  }

  return generateComponent
}

const routingComponentGenerator = configureRouterAsemblyLine()

const processProjectUIDL = async (jsDoc: any) => {
  console.log('processing', jsDoc)

  // pick root name/id

  const { components, root } = jsDoc
  const keys = Object.keys(components)
  // tslint:disable-next-line:forin
  for (const i in keys) {
    const key = keys[i]
    if (components[key].name === root) {
      try {
        const componentCode = await routingComponentGenerator(components[key])
        console.log('build root', components[key], componentCode)
      } catch (err) {
        console.error(key, err)
      }
    } else {
      try {
        console.log('build component', components[key])
        const componentCode = await componentGenerator(components[key])
        console.log(componentCode)
      } catch (err) {
        console.error(key, err)
      }
    }
  }
}

processProjectUIDL(componentWithStates)
