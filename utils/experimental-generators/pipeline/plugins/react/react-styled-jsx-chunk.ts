import preset from 'jss-preset-default'
import jss from 'jss'
jss.setup(preset())

import { ComponentPlugin, ComponentPluginFactory, EmbedDefinition } from '../../types'

import { addClassStringOnJSXTag, generateStyledJSXTag } from '../../utils/jsx-ast'

import { cammelCaseToDashCase } from '../../utils/helpers'

const generateStyledJSXString = (content: any, uidlMappings: any) => {
  let accumulator: any[] = []

  // only do stuff if content is a object
  if (content && typeof content === 'object') {
    const { style, children, name } = content
    if (style) {
      const root = uidlMappings[name]
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
      addClassStringOnJSXTag(root, className)
    }

    if (children && Array.isArray(children)) {
      children.forEach((child) => {
        const items = generateStyledJSXString(child, uidlMappings)
        accumulator = accumulator.concat(...items)
      })
    }
  }

  return accumulator
}
interface StyledJSXConfig {
  chunkName: string
  targetJsxChunk: string
}

export const createPlugin: ComponentPluginFactory<StyledJSXConfig> = (config) => {
  const {
    chunkName = 'react-component-styled-jsx',
    targetJsxChunk = 'react-component-jsx',
  } = config || {}

  const reactStyledJSXChunkPlugin: ComponentPlugin = async (structure) => {
    const { uidl, chunks } = structure

    const { content } = uidl

    const jsxChunk = chunks.filter((chunk) => chunk.name === targetJsxChunk)[0]
    if (!jsxChunk) {
      return structure
    }

    const jsxChunkMappings = jsxChunk.meta.uidlMappings

    const styleJSXString = generateStyledJSXString(content, jsxChunkMappings)

    const jsxASTNodeReference = generateStyledJSXTag(styleJSXString.join('\n'))
    // We have the ability to insert the tag into the existig JSX structure, or
    // do something else with it. For now, to move faster, we'll add it to the existing
    // ast structure directly.

    // we have in the mappings references to jsx ast tags
    // jsxChunkMappings[content.name].children.push(jsxASTNodeReference)

    chunks.push({
      type: 'jsx',
      name: chunkName,
      meta: {},
      linker: {
        // after: ['react-import'],
        embed: {
          chunkName: targetJsxChunk,
          slot: 'children',
        },
      },
      content: jsxASTNodeReference,
    })

    return structure
  }

  return reactStyledJSXChunkPlugin
}

export default createPlugin()
