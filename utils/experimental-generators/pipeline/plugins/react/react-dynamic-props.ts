import { ComponentPlugin } from '../../types'

import * as t from '@babel/types'

/**
 * Makes `${name}={props.${value}}` happen in AST
 *
 * @param jsxASTNode the jsx ast element
 * @param name the name of the prop
 * @param value the value of the prop (will be concatenated with props. before it)
 */
const addDynamicPropOnJsxOpeningTag = (
  jsxASTNode: t.JSXElement,
  name: string,
  value: string
) => {
  jsxASTNode.openingElement.attributes.push(
    t.jsxAttribute(
      t.jsxIdentifier(name),
      t.jsxExpressionContainer(
        t.memberExpression(t.identifier('props'), t.identifier(value))
      )
    )
  )
}

const addDynamicPropsOnJSXOpeningTag = (
  jsxASTNode: t.JSXElement,
  attrs: { [key: string]: any }
) => {
  Object.keys(attrs).forEach((key) => {
    const attrValue = attrs[key].replace('$props.', '')
    addDynamicPropOnJsxOpeningTag(jsxASTNode, key, attrValue)
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

    const jsxASTNode = jsxASTTag.node
    addDynamicPropsOnJSXOpeningTag(jsxASTNode, attrs)
  }

  if (Array.isArray(children)) {
    children.forEach((child) => enhanceJSXWithDynamicProps(child, uidlMappings))
  }
}

/**
 * Generate the inlines stlye definition as a AST block which will represent the
 * defined styles of this component in UIDL
 *
 * @param structure : ComponentStructure
 */
const reactDynamicPropsPlugin: ComponentPlugin = async (structure) => {
  const { uidl, chunks } = structure

  const theJSXChunk = chunks.filter(
    (chunk) => chunk.type === 'jsx' && chunk.meta.usage === 'react-component-jsx'
  )[0]

  if (!theJSXChunk) {
    return structure
  }

  enhanceJSXWithDynamicProps(uidl.content, theJSXChunk.meta.uidlMappings)

  return structure
}

export default reactDynamicPropsPlugin
