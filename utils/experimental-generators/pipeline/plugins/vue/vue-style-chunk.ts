import preset from 'jss-preset-default'
import jss from 'jss'
jss.setup(preset())

import { ComponentPlugin, ComponentPluginFactory } from '../../types'
import { cammelCaseToDashCase } from '../../utils/helpers'

const filterOutDynamicStyles = (style: any) => {
  if (!style) {
    return { staticStyles: null, dynamicStyles: null }
  }
  return Object.keys(style).reduce(
    (acc: any, key) => {
      const styleValue = style[key].toString()
      if (styleValue.startsWith('$props.')) {
        acc.dynamicStyles[key] = styleValue.replace('$props.', '')
      } else {
        acc.staticStyles[key] = styleValue
      }
      return acc
    },
    { staticStyles: {}, dynamicStyles: {} }
  )
}

const generateStyleTagStrings = (content: any, templateLookup: any) => {
  let accumulator: any[] = []
  // only do stuff if content is a object
  if (content && typeof content === 'object') {
    const { style, children, name } = content
    const { staticStyles, dynamicStyles } = filterOutDynamicStyles(style)
    if (style) {
      const root = templateLookup[name]
      const className = cammelCaseToDashCase(name)
      accumulator.push(
        jss
          .createStyleSheet(
            {
              [`.${className}`]: staticStyles,
            },
            {
              generateClassName: () => className,
            }
          )
          .toString()
      )

      if (Object.keys(dynamicStyles).length) {
        const vueFriendlyStyleBind = Object.keys(dynamicStyles).reduce(
          (acc: string[], key) => {
            acc.push(`${key}: ${dynamicStyles[key]}`)
            return acc
          },
          []
        )
        root.attr(':style', `{${vueFriendlyStyleBind.join(', ')}}`)
      }

      root.addClass(className)
    }

    if (children && Array.isArray(children)) {
      children.forEach((child) => {
        const items = generateStyleTagStrings(child, templateLookup)
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
  styleFileId: string
}

export const createPlugin: ComponentPluginFactory<VueStyleChunkConfig> = (config) => {
  const {
    chunkName = 'vue-component-style-chunk',
    vueTemplateChunk = 'vue-component-template-chunk',
    styleFileId = null,
  } = config || {}

  const vueComponentStyleChunkPlugin: ComponentPlugin = async (structure) => {
    const { uidl, chunks } = structure

    const { content } = uidl

    const templateChunk = chunks.filter((chunk) => chunk.name === vueTemplateChunk)[0]
    const templateLookup = templateChunk.meta.lookup

    const jssStylesArray = generateStyleTagStrings(content, templateLookup)

    chunks.push({
      type: 'string',
      name: chunkName,
      meta: {
        fileId: styleFileId,
      },
      wrap: styleFileId
        ? undefined
        : (generatedContent) => {
            return `<style>\n\n${generatedContent}</style>\n`
          },
      content: jssStylesArray.join('\n'),
    })

    return structure
  }

  return vueComponentStyleChunkPlugin
}

export default createPlugin()
