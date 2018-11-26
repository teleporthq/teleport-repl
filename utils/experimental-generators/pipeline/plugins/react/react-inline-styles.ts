import { ComponentPlugin, ComponentPluginFactory } from '../../types'

import * as t from '@babel/types'

import { addJSXTagStyles } from '../../utils/jsx-ast'

/**
 * Walks the content tree and modify the jsx ast representation by adding new
 * style attributes on nodes that define styles for themselves in uidl.
 *
 * @param content - uidl
 * @param jsxASTNode - uidlMappings the mappings used to point from uidl to
 * our content chunk so we can easily see which node from content is describe
 * in which section in the AST representation
 */
const enhanceJSXWithStyles = (content: any, uidlMappings: any) => {
  const { children, style, name } = content

  if (style) {
    const jsxASTTag = uidlMappings[name]
    if (!jsxASTTag) {
      return
    }

    addJSXTagStyles(jsxASTTag, style, t)
  }

  if (Array.isArray(children)) {
    children.forEach((child) => enhanceJSXWithStyles(child, uidlMappings))
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

    enhanceJSXWithStyles(uidl.content, componentChunk.meta.uidlMappings)

    return structure
  }
  return reactInlineStyleComponentPlugin
}

export default createPlugin()
