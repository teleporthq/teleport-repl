import * as types from '@babel/types'

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
