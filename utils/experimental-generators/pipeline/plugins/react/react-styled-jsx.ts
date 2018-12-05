import preset from 'jss-preset-default'
import jss from 'jss'
jss.setup(preset())

import { ComponentPlugin, ComponentPluginFactory } from '../../types'

import { addClassStringOnJSXTag, generateStyledJSXTag } from '../../utils/jsx-ast'

import { cammelCaseToDashCase } from '../../utils/helpers'

const generateStyledJSXString = (content: any, nodesLookup: any) => {
  let accumulator: any[] = []

  // only do stuff if content is a object
  if (content && typeof content === 'object') {
    const { style, children, name } = content
    if (style) {
      const root = nodesLookup[name]
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
        const items = generateStyledJSXString(child, nodesLookup)
        accumulator = accumulator.concat(...items)
      })
    }
  }

  return accumulator
}
interface StyledJSXConfig {
  componentChunkName: string
}

export const createPlugin: ComponentPluginFactory<StyledJSXConfig> = (config) => {
  const { componentChunkName = 'react-component' } = config || {}

  const reactStyledJSXChunkPlugin: ComponentPlugin = async (structure) => {
    const { uidl, chunks } = structure

    const { content } = uidl

    const componentChunk = chunks.find((chunk) => chunk.name === componentChunkName)
    if (!componentChunk) {
      return structure
    }

    const jsxNodesLookup = componentChunk.meta.nodesLookup

    const styleJSXString = generateStyledJSXString(content, jsxNodesLookup)

    if (!styleJSXString || !styleJSXString.length) {
      return structure
    }

    const jsxASTNodeReference = generateStyledJSXTag(styleJSXString.join('\n'))
    const rootJSXNode = jsxNodesLookup[content.name]

    // We have the ability to insert the tag into the existig JSX structure, or do something else with it.
    // Here we take the JSX <style> tag and we insert it as the last child of the JSX structure
    // inside the React Component
    rootJSXNode.children.push(jsxASTNodeReference)

    return structure
  }

  return reactStyledJSXChunkPlugin
}

export default createPlugin()
