import Teleport from '@teleporthq/teleport-lib-js'
import TeleportGeneratorReact from '@teleporthq/teleport-generator-react'
import TeleportGeneratorVue from '@teleporthq/teleport-generator-vue'
import TeleportGeneratorHtml from '@teleporthq/teleport-generator-html'
import TeleportElementsCore from '@teleporthq/teleport-elements-core'

const npmMappings = [
  TeleportElementsCore.definitions,
  TeleportElementsCore.mappingHtml,
  TeleportElementsCore.mappingReact,
  TeleportElementsCore.mappingReactNative,
  TeleportElementsCore.mappingVue,
]

interface LoadWrapperPromise {
  generateComponent: (input: any, target: string) => any
}

const loadWrapper = (): Promise<LoadWrapperPromise> => {
  return new Promise((resolve) => {
    const teleport = new Teleport()

    const teleportWrapper = {
      generateComponent(input: any, target = 'react') {
        const generatorName = (target || 'react') + '-generator'
        const generator = teleport.generator(generatorName)

        if (!generator) {
          // tslint:disable-next-line:no-console
          console.log(`${target} generator is not loaded. Please check teleportWrapper.ts`)
          return
        }

        try {
          return generator.generateComponent(input, {})
        } catch (error) {
          // tslint:disable-next-line:no-console
          console.error('Generator Error: ', error)
        }
      },
    }

    setTimeout(async () => {
      await teleport.use([...npmMappings])
      await teleport.useGenerator(new TeleportGeneratorReact())
      await teleport.useGenerator(new TeleportGeneratorVue())
      await teleport.use(new TeleportGeneratorHtml())
      resolve(teleportWrapper)
    })
  })
}

export default loadWrapper
