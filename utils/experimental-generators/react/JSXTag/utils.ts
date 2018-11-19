/**
 * Generates the AST definiton (without start/end position) for a JSX tag
 * with an opening and closing tag.
 *
 * t is the babel-types api which generates the JSON structure representing the AST.
 * This is set as a parameter to allow us to remove babel-types at some point if we
 * decide to, and to allow easier unit testing of the utils.
 *
 * Requires the tagName, which is a string that will be used to generate the
 * tag.
 *
 * Example:
 * generateASTDefinitionForJSXTag(t, { tagName: "div" }) will generate the AST
 * equivalent of <div></div>
 */
export const generateASTDefinitionForJSXTag = (
  t,
  instanceOptions: { tagName: string }
) => {
  const jsxIdentifier = t.jsxIdentifier(instanceOptions.tagName)
  const openingDiv = t.jsxOpeningElement(jsxIdentifier, [], false)
  const closingDiv = t.jsxClosingElement(jsxIdentifier)

  const tag = t.jsxElement(openingDiv, closingDiv, [], false)

  return tag
}

/**
 * node must be a AST node element of type JSXElement (babel-types) or
 * equivalent
 */
export const addASTAttributeToJSXTag = (node, t, attribute) => {
  const nameOfAttribute = t.jsxIdentifier(attribute.name)
  const attributeDefinition = t.jsxAttribute(
    nameOfAttribute,
    t.stringLiteral(attribute.value)
  )
  node.openingElement.attributes.push(attributeDefinition)
}

export const addJSXTagStyles = (node, t, styleMap) => {
  const styleObjectExpression = objectToObjectExpression(t, styleMap)
  const styleObjectExpressionContainer = t.jsxExpressionContainer(styleObjectExpression)

  const styleJSXAttr = t.jsxAttribute(
    t.jsxIdentifier('style'),
    styleObjectExpressionContainer
  )

  node.openingElement.attributes.push(styleJSXAttr)
}

export const objectToObjectExpression = (
  t: {
    identifier: (a: string) => any
    stringLiteral: (a: string) => any
    numericLiteral: (a: number) => any
    objectProperty: (a: any, b: any) => any
    objectExpression: (a: any) => any
  },
  objectMap: { [key: string]: any }
) => {
  const props = Object.keys(objectMap).reduce((acc: any[], key) => {
    const keyIdentifier: string = t.identifier(key)
    const value = objectMap[key]
    let computedLiteralValue = null

    if (typeof value === 'string') {
      computedLiteralValue = t.stringLiteral(value)
    } else if (typeof value === 'number') {
      computedLiteralValue = t.numericLiteral(value)
    } else if (typeof value === 'object') {
      computedLiteralValue = objectToObjectExpression(t, value)
    }

    acc.push(t.objectProperty(keyIdentifier, computedLiteralValue))
    return acc
  }, [])

  const objectExpression = t.objectExpression(props)
  return objectExpression
}
