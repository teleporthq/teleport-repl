import * as types from '@babel/types'
import { objectToObjectExpression } from './js-ast'

/**
 * Gets the existing className declaration attribute or generates and returns
 * a newly created and assigned one to the given JSXNode
 */
export const getClassAttribute = (
  jsxNode: types.JSXElement,
  params: { createIfNotFound: boolean } = { createIfNotFound: false },
  t = types
): types.JSXAttribute => {
  const results = jsxNode.openingElement.attributes.filter((attribute) => {
    return attribute.type === 'JSXAttribute' && attribute.name.name === 'className'
  })

  // we don't have a result, but we have a createIFNotFound condition
  if (!results[0] && params && params.createIfNotFound) {
    const createdClassAttribute = t.jsxAttribute(
      t.jsxIdentifier('className'),
      t.stringLiteral('')
    )

    jsxNode.openingElement.attributes.push(createdClassAttribute)
    return createdClassAttribute
  }

  return results[0] as types.JSXAttribute
}

/**
 * Adds a class definition string to an existing string of classes
 */
export const addClassStringOnJSXTag = (
  jsxNode: types.JSXElement,
  classString: string,
  t = types
) => {
  const classAttribute = getClassAttribute(jsxNode, { createIfNotFound: true }, t)
  if (classAttribute.value && classAttribute.value.type === 'StringLiteral') {
    const classArray = classAttribute.value.value.split(' ')
    classArray.push(classString)
    classAttribute.value.value = classArray.join(' ').trim()
  } else {
    throw new Error(
      'Attempted to set a class string literral on a jsx\
     tag wchih had an invalid className attribute'
    )
  }
}

/**
 * Makes `${name}={props.${value}}` happen in AST
 *
 * @param jsxASTNode the jsx ast element
 * @param name the name of the prop
 * @param value the value of the prop (will be concatenated with props. before it)
 */
export const addDynamicPropOnJsxOpeningTag = (
  jsxASTNode: types.JSXElement,
  name: string,
  value: string,
  t = types
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

export const addExternalPropOnJsxOpeningTag = (
  jsxASTNode: types.JSXElement,
  name: string,
  memberExpression: any,
  t = types
) => {
  jsxASTNode.openingElement.attributes.push(
    t.jsxAttribute(t.jsxIdentifier(name), t.jsxExpressionContainer(memberExpression))
  )
}

export const stringAsTemplateLiteral = (str: string, t = types) => {
  const formmattedString = `
${str}
  `
  return t.templateLiteral(
    [
      t.templateElement(
        {
          raw: formmattedString,
          cooked: formmattedString,
        },
        true
      ),
    ],
    []
  )
}

export const generateStyledJSXTag = (
  templateLiteral: string | types.TemplateLiteral,
  t = types
) => {
  if (typeof templateLiteral === 'string') {
    templateLiteral = stringAsTemplateLiteral(templateLiteral, t)
  }

  const jsxTagChild = t.jsxExpressionContainer(templateLiteral)
  const jsxTag = generateBasicJSXTag('style', [jsxTagChild, t.jsxText('\n')], t)
  addASTAttributeToJSXTag(jsxTag, { name: 'jsx' }, t)
  return jsxTag
}

export const generateBasicJSXTag = (tagName: string, children: any[] = [], t = types) => {
  const jsxIdentifier = t.jsxIdentifier(tagName)
  const openingDiv = t.jsxOpeningElement(jsxIdentifier, [], false)
  const closingDiv = t.jsxClosingElement(jsxIdentifier)

  const tag = t.jsxElement(openingDiv, closingDiv, children, false)

  return tag
}

/**
 * node must be a AST node element of type JSXElement (babel-types) or
 * equivalent
 */
const getProperAttributeValueAssignment = (value: any, t = types) => {
  switch (typeof value) {
    case 'string':
      return t.stringLiteral(value)
    case 'number':
      return t.jsxExpressionContainer(t.numericLiteral(value))
    case 'undefined':
      return null
    default:
      return value
  }
}
export const addASTAttributeToJSXTag = (
  jsxNode: types.JSXElement,
  attribute: { name: string; value?: any },
  t = types
) => {
  const nameOfAttribute = t.jsxIdentifier(attribute.name)
  let attributeDefinition
  if (typeof attribute.value === 'boolean') {
    attributeDefinition = t.jsxAttribute(nameOfAttribute)
  } else {
    attributeDefinition = t.jsxAttribute(
      nameOfAttribute,
      getProperAttributeValueAssignment(attribute.value)
    )
  }
  jsxNode.openingElement.attributes.push(attributeDefinition)
}

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
 * generateASTDefinitionForJSXTag("div") will generate the AST
 * equivalent of <div></div>
 */
export const generateASTDefinitionForJSXTag = (tagName: string, t = types) => {
  const jsxIdentifier = t.jsxIdentifier(tagName)
  const openingDiv = t.jsxOpeningElement(jsxIdentifier, [], false)
  const closingDiv = t.jsxClosingElement(jsxIdentifier)

  const tag = t.jsxElement(openingDiv, closingDiv, [], false)

  return tag
}

export const addChildJSXTag = (tag: types.JSXElement, childNode: types.JSXElement) => {
  tag.children.push(types.jsxText('\n'), childNode, types.jsxText('\n'))
}

export const addChildJSXText = (tag: types.JSXElement, text: string, t = types) => {
  tag.children.push(t.jsxText(text))
}

export const addDynamicChild = (tag: types.JSXElement, value: string, t = types) => {
  tag.children.push(
    t.jsxExpressionContainer(
      t.memberExpression(t.identifier('props'), t.identifier(value))
    )
  )
}

export const addJSXTagStyles = (tag: types.JSXElement, styleMap: any, t = types) => {
  const styleObjectExpression = objectToObjectExpression(styleMap, t)
  const styleObjectExpressionContainer = t.jsxExpressionContainer(styleObjectExpression)

  const styleJSXAttr = t.jsxAttribute(
    t.jsxIdentifier('style'),
    styleObjectExpressionContainer
  )
  console.log('tag', tag)
  tag.openingElement.attributes.push(styleJSXAttr)
}
