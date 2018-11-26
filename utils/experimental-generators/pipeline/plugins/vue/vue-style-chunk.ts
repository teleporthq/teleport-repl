import preset from 'jss-preset-default'
import jss from 'jss'
jss.setup(preset())

import { ComponentPlugin, ComponentPluginFactory } from '../../types'
import { cammelCaseToDashCase } from '../../utils/helpers'

const generateStyleTagStrings = (content: any, mappings: any) => {
  let accumulator: any[] = []
  // only do stuff if content is a object
  if (content && typeof content === 'object') {
    const { style, children, name } = content
    if (style) {
      const root = mappings[name]
      const className = cammelCaseToDashCase(name)
      accumulator.push(
        jss
          .createStyleSheet(
            {
              [`.${className}`]: style,
            },
            {
              generateClassName: () => className,
            }
          )
          .toString()
      )

      root.addClass(className)
    }

    if (children && Array.isArray(children)) {
      children.forEach((child) => {
        const items = generateStyleTagStrings(child, mappings)
        accumulator = accumulator.concat(...items)
      })
    }
  }

  return accumulator
}

interface VueStyleChunkConfig {
  chunkName: string
  vueJSChunk: string
  vueTemplateChunk: string
}

export const createPlugin: ComponentPluginFactory<VueStyleChunkConfig> = (config) => {
  const {
    chunkName = 'vue-component-style-chunk',
    vueTemplateChunk = 'vue-component-template-chunk',
  } = config || {}

  const vueComponentStyleChunkPlugin: ComponentPlugin = async (structure) => {
    const { uidl, chunks } = structure

    const { content } = uidl

    const templateChunk = chunks.filter((chunk) => chunk.name === vueTemplateChunk)[0]
    const templateChunkMappings = templateChunk.meta.mappings

    const jssStylesArray = generateStyleTagStrings(content, templateChunkMappings)

    chunks.push({
      type: 'string',
      name: chunkName,
      wrap: (generatedContent) => {
        return `<style>\n\n${generatedContent}</style>\n`
      },
      content: jssStylesArray.join('\n'),
    })

    return structure
  }

  return vueComponentStyleChunkPlugin
}

export default createPlugin()
