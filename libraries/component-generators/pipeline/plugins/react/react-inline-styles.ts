import { ComponentPlugin, ComponentPluginFactory } from '../../types'
import { ComponentContent } from '../../../../uidl-definitions/types'

import * as t from '@babel/types'

import { addJSXTagStyles } from '../../utils/jsx-ast'
import { ParsedASTNode } from '../../utils/js-ast'

const prepareDynamicProps = (style: any) => {
  return Object.keys(style).reduce((acc: any, key) => {
    const value = style[key]
    if (typeof value === 'string' && value.startsWith('$props.')) {
      acc[key] = new ParsedASTNode(
        t.memberExpression(
          t.identifier('props'),
          t.identifier(value.replace('$props.', ''))
        )
      )
    } else {
      acc[key] = style[key]
    }
    return acc
  }, {})
}

/**
 * Walks the content tree and modify the jsx ast representation by adding new
 * style attributes on nodes that define styles for themselves in uidl.
 *
 * @param content - uidl
 * @param jsxASTNode - nodesLookup the lookup used to point from uidl to
 * our content chunk so we can easily see which node from content is describe
 * in which section in the AST representation
 */
const enhanceJSXWithStyles = (
  content: ComponentContent,
  nodesLookup: Record<string, t.JSXElement>
) => {
  const { children, style, key } = content

  if (style) {
    const jsxASTTag = nodesLookup[key]
    if (!jsxASTTag) {
      return
    }

    addJSXTagStyles(jsxASTTag, prepareDynamicProps(style), t)
  }

  if (Array.isArray(children)) {
    children.forEach((child) => {
      if (typeof child !== 'string') {
        enhanceJSXWithStyles(child, nodesLookup)
      }
    })
  }
}

interface InlineStyleConfig {
  componentChunkName: string
}
export const createPlugin: ComponentPluginFactory<InlineStyleConfig> = (config) => {
  const { componentChunkName = 'react-component' } = config || {}
  /**
   * Generate the inlines stlye definition as a AST block which will represent the
   * defined styles of this component in UIDL
   *
   * @param structure : ComponentStructure
   */
  const reactInlineStyleComponentPlugin: ComponentPlugin = async (structure) => {
    const { uidl, chunks } = structure

    const componentChunk = chunks.find((chunk) => chunk.name === componentChunkName)

    if (!componentChunk) {
      return structure
    }

    enhanceJSXWithStyles(uidl.content, componentChunk.meta.nodesLookup)

    return structure
  }
  return reactInlineStyleComponentPlugin
}

export default createPlugin()
