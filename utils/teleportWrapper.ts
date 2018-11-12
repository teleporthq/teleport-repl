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

const loadWrapper = (): Promise<{ generateComponent: (input: any, target: string) => any }> => {
  return new Promise((resolve, reject) => {
    const teleport = new Teleport()

    const teleportWrapper = {
      generateComponent(input: any, target = 'react') {
        const generator = teleport.target(target || 'react')
        if (generator) {
          return generator.generator.generateComponent(input, {})
        }
      },

      // generateProject(input: any, target = 'next') {
      //   const generatorOptions = {
      //     componentsPath: './src/components',
      //     pagesPath: './src/pages',
      //     assetsPath: './public/assets',
      //     assetsUrl: '/assets',
      //     generateAllFiles: true,
      //   }

      //   return teleport.target(target).generator.generateProject(input, generatorOptions)
      // },
    }

    setTimeout(async () => {
      await teleport.use([...npmMappings, new TeleportGeneratorReact(), new TeleportGeneratorVue(), new TeleportGeneratorHtml()])
      resolve(teleportWrapper)
    })
  })
}

export default loadWrapper
