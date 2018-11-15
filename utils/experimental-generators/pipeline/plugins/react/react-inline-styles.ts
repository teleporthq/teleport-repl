import { ComponentPlugin } from '../../types'

import * as t from '@babel/types'

import { addJSXTagStyles } from '../../../react/JSXTag/utils'

/**
 * NOT IDEAL IMPLEMENTATION!!!!
 * We don't have a link between the UIDL and the JSX subtags created. We should.
 *
 * Walks the AST tree of the given JSX representation, and checks to see if the
 * content needs styles.
 *
 * @param content - uidl
 * @param jsxASTNode - the JSX AST node, babel edition
 */
const enhanceJSXWithStyles = (content: any, jsxASTNode: t.JSXText | t.JSXExpressionContainer | t.JSXSpreadChild | t.JSXElement | t.JSXFragment) => {
  const { children, style } = content

  if (style) {
    addJSXTagStyles(jsxASTNode, t, style)
  }

  if (Array.isArray(children)) {
    children.map((child, idx) => {
      if (jsxASTNode.type !== 'JSXText') {
        enhanceJSXWithStyles(child, (jsxASTNode as t.JSXFragment).children[idx])
      }
    })
  }
}

/**
 * Generate the inlines stlye definition as a AST block which will represent the
 * defined styles of this component in UIDL
 *
 * @param structure : ComponentStructure
 */
const reactInlineStyleComponentPlugin: ComponentPlugin = async (structure) => {
  const { uidl, chunks } = structure

  const theJSXChunk = chunks.filter((chunk) => chunk.type === 'jsx' && chunk.meta.usage === 'react-component-jsx')[0]

  if (!theJSXChunk) {
    return structure
  }

  enhanceJSXWithStyles(uidl.content, theJSXChunk.content.node)

  return structure
}

export default reactInlineStyleComponentPlugin
