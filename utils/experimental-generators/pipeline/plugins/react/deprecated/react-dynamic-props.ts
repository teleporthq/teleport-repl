import { ComponentPlugin, EmbedDefinition, ComponentPluginFactory } from '../../../types'

import * as t from '@babel/types'
import { addDynamicPropOnJsxOpeningTag } from '../../../utils/jsx-ast'

const addDynamicPropsOnJSXOpeningTag = (
  jsxASTNode: t.JSXElement,
  attrs: { [key: string]: any }
) => {
  Object.keys(attrs).forEach((key) => {
    if (attrs[key][0] === '$') {
      const attrValue = attrs[key].replace('$props.', '')
      addDynamicPropOnJsxOpeningTag(jsxASTNode, key, attrValue)
    }
  })
}

/**
 * Walk the uidl contnet tree for a component and add dynamic props
 * on the jsx ast tree where needed.
 *
 * @param content - uidl
 * @param jsxASTNode - uidlMappings the mappings used to point from uidl to
 * our content chunk so we can easily see which node from content is describe
 * in which section in the AST representation
 */
const enhanceJSXWithDynamicProps = (content: any, uidlMappings: any) => {
  const { children, attrs, name } = content

  if (attrs) {
    const jsxASTTag = uidlMappings[name]
    if (!jsxASTTag) {
      return
    }

    addDynamicPropsOnJSXOpeningTag(jsxASTTag, attrs)
  }

  if (Array.isArray(children)) {
    children.forEach((child) => enhanceJSXWithDynamicProps(child, uidlMappings))
  }
}

/**
 * Generate the inlines stlye definition as a AST block which will represent the
 * defined styles of this component in UIDL
 */

interface JSXConfig {
  targetJSXChunk: string
}
export const createPlugin: ComponentPluginFactory<JSXConfig> = (config) => {
  const { targetJSXChunk = 'react-component-jsx' } = config || {}

  const reactDynamicPropsPlugin: ComponentPlugin = async (structure) => {
    const { uidl, chunks } = structure

    const targetJSX = chunks.filter((chunk) => chunk.name === targetJSXChunk)[0]

    if (!targetJSX) {
      return structure
    }

    enhanceJSXWithDynamicProps(uidl.content, targetJSX.meta.uidlMappings)

    return structure
  }

  return reactDynamicPropsPlugin
}

export default createPlugin()
