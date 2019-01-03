import preset from 'jss-preset-default'
import jss from 'jss'
jss.setup(preset())

import * as t from '@babel/types'

import { ComponentPlugin, ComponentPluginFactory } from '../../types'

import { addClassStringOnJSXTag, generateStyledJSXTag } from '../../utils/jsx-ast'

import { cammelCaseToDashCase } from '../../utils/helpers'
import { ComponentContent } from '../../../../uidl-definitions/types'

const prepareDynamicProps = (style: any) => {
  return Object.keys(style).reduce((acc: any, key) => {
    const value = style[key]
    // tslint:disable-next-line:prefer-conditional-expression
    if (typeof value === 'string' && value.startsWith('$props.')) {
      acc[key] = `\$\{${value.replace('$props.', 'props.')}\}`
    } else {
      acc[key] = style[key]
    }
    return acc
  }, {})
}

const generateStyledJSXString = (
  content: ComponentContent,
  nodesLookup: Record<string, t.JSXElement>
) => {
  let accumulator: any[] = []

  const { style, children, key } = content
  if (style) {
    const root = nodesLookup[key]
    const className = cammelCaseToDashCase(key)
    accumulator.push(
      jss
        .createStyleSheet(
          {
            [`.${className}`]: prepareDynamicProps(style),
          },
          {
            generateClassName: () => className,
          }
        )
        .toString()
    )
    addClassStringOnJSXTag(root, className)
  }

  if (children) {
    children.forEach((child) => {
      // Skip text children
      if (typeof child === 'string') {
        return
      }

      if (child.type === 'state') {
        const { states = [] } = child
        states.forEach((stateBranch) => {
          const stateContent = stateBranch.content
          if (typeof stateContent === 'string') {
            return
          }

          accumulator = accumulator.concat(
            generateStyledJSXString(stateContent, nodesLookup)
          )
        })

        return
      }

      const items = generateStyledJSXString(child, nodesLookup)
      accumulator = accumulator.concat(...items)
    })
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
    const rootJSXNode = jsxNodesLookup[content.key]

    // We have the ability to insert the tag into the existig JSX structure, or do something else with it.
    // Here we take the JSX <style> tag and we insert it as the last child of the JSX structure
    // inside the React Component
    rootJSXNode.children.push(jsxASTNodeReference)

    return structure
  }

  return reactStyledJSXChunkPlugin
}

export default createPlugin()
