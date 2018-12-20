import * as types from '@babel/types'
import { StateIdentifier } from './types'
import { capitalize } from '../../utils/helpers'
import { convertValueToLiteral } from '../../utils/js-ast'

import { EventDefinitions } from '../../../../uidl-definitions/types'

// Adds all the event handlers and all the instructions for each event handler
// in case there is more than one specified in the UIDL
export const addEventsToTag = (
  tag: types.JSXElement,
  events: EventDefinitions,
  stateIdentifiers: Record<string, StateIdentifier>,
  t = types
) => {
  Object.keys(events).forEach((eventKey) => {
    const eventHandlerActions = events[eventKey]
    const eventHandlerStatements: types.ExpressionStatement[] = []

    eventHandlerActions.forEach((eventHandlerAction) => {
      const stateKey = eventHandlerAction.modifies
      const stateIdentifier = stateIdentifiers[stateKey]

      if (!stateIdentifier) {
        console.log(`No state hook was found for "${stateKey}"`)
        return null
      }

      const stateSetterArgument =
        eventHandlerAction.newState === '$toggle'
          ? t.unaryExpression('!', t.identifier(stateIdentifier.key))
          : convertValueToLiteral(eventHandlerAction.newState, stateIdentifier.type)

      eventHandlerStatements.push(
        t.expressionStatement(
          t.callExpression(t.identifier(stateIdentifier.setter), [stateSetterArgument])
        )
      )
    })

    const jsxEventKey = convertToReactEventName(eventKey)
    tag.openingElement.attributes.push(
      t.jsxAttribute(
        t.jsxIdentifier(jsxEventKey),
        t.jsxExpressionContainer(
          t.arrowFunctionExpression([], t.blockStatement(eventHandlerStatements))
        )
      )
    )
  })
}

export const makePureComponent = (
  name: string,
  stateIdentifiers: Record<string, StateIdentifier>,
  jsxTagTree: types.JSXElement,
  t = types
) => {
  const returnStatement = t.returnStatement(jsxTagTree)

  const stateHooks = Object.keys(stateIdentifiers).map((stateKey) =>
    makeStateHookAST(stateIdentifiers[stateKey])
  )

  const arrowFunction = t.arrowFunctionExpression(
    [t.identifier('props')],
    t.blockStatement([...stateHooks, returnStatement] || [])
  )

  const declarator = t.variableDeclarator(t.identifier(name), arrowFunction)
  const component = t.variableDeclaration('const', [declarator])

  return component
}

/**
 * Creates an AST line for defining a single state hook
 */
export const makeStateHookAST = (stateIdentifier: StateIdentifier, t = types) => {
  const defaultValueArgument = convertValueToLiteral(
    stateIdentifier.default,
    stateIdentifier.type
  )
  return t.variableDeclaration('const', [
    t.variableDeclarator(
      t.arrayPattern([
        t.identifier(stateIdentifier.key),
        t.identifier(stateIdentifier.setter),
      ]),
      t.callExpression(t.identifier('useState'), [defaultValueArgument])
    ),
  ])
}

export const convertToReactEventName = (str: string): string => 'on' + capitalize(str)
