import * as types from '@babel/types'
import { StateHook } from './types'
import { capitalize } from '../../utils/helpers'

import { EventDefinitions, StateDefinitions } from '../../../../uidl-definitions/types'

// Adds all the event handlers and all the instructions for each event handler
// in case there is more than one specified in the UIDL
export const addEventsToTag = (
  tag: types.JSXElement,
  events: EventDefinitions,
  stateDefinitions: StateDefinitions,
  stateHooksIdentifiers: StateHook[],
  t = types
) => {
  Object.keys(events).forEach((eventKey) => {
    const eventHandlerActions = events[eventKey]
    const eventHandlerStatements: Array<
      types.SwitchStatement | types.ExpressionStatement
    > = []

    eventHandlerActions.forEach((eventHandlerAction) => {
      const stateKey = eventHandlerAction.modifies
      const stateDefinition = stateDefinitions[stateKey]
      const stateHook = stateHooksIdentifiers.find((hook) => hook.key === stateKey)

      if (!stateHook) {
        console.log(`No state hook was found for "${stateKey}"`)
        return null
      }

      if (stateDefinition.type === 'string') {
        if (typeof eventHandlerAction.newState === 'string') {
          eventHandlerStatements.push(
            t.expressionStatement(
              t.callExpression(t.identifier(stateHook.setter), [
                t.stringLiteral(eventHandlerAction.newState),
              ])
            )
          )
        }
      }

      if (stateDefinition.type === 'number') {
        const numericValue = eventHandlerAction.newState as number
        eventHandlerStatements.push(
          t.expressionStatement(
            t.callExpression(t.identifier(stateHook.setter), [
              t.numericLiteral(numericValue),
            ])
          )
        )
      }

      if (stateDefinition.type === 'boolean') {
        // In case there's a non-boolean value, it will default to true. undefined/null will set it to false
        const stateSetterArgument =
          eventHandlerAction.newState === '$toggle'
            ? t.unaryExpression('!', t.identifier(stateHook.key))
            : t.booleanLiteral(!!eventHandlerAction.newState)

        eventHandlerStatements.push(
          t.expressionStatement(
            t.callExpression(t.identifier(stateHook.setter), [stateSetterArgument])
          )
        )
      }
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
  stateHooksIdentifiers: StateHook[],
  jsxTagTree: types.JSXElement,
  t = types
) => {
  const returnStatement = t.returnStatement(jsxTagTree)

  const stateHooks = stateHooksIdentifiers.map((stateHook) => makeStateHookAST(stateHook))

  const arrowFunction = t.arrowFunctionExpression(
    [t.identifier('props')],
    t.blockStatement([...stateHooks, returnStatement] || [])
  )

  const declarator = t.variableDeclarator(t.identifier(name), arrowFunction)
  const component = t.variableDeclaration('const', [declarator])

  return component
}

export const makeDefaultArgument = (stateHook: StateHook, t = types) => {
  if (stateHook.type === 'string') {
    return t.stringLiteral(stateHook.default)
  }

  if (stateHook.type === 'boolean') {
    return t.booleanLiteral(stateHook.default)
  }

  if (stateHook.type === 'number') {
    return t.numericLiteral(stateHook.default)
  }

  return t.identifier(stateHook.default)
}

/**
 * Creates an AST line for defining a single state hook
 */
export const makeStateHookAST = (stateHook: StateHook, t = types) => {
  const defaultValueArgument = makeDefaultArgument(stateHook)
  return t.variableDeclaration('const', [
    t.variableDeclarator(
      t.arrayPattern([t.identifier(stateHook.key), t.identifier(stateHook.setter)]),
      t.callExpression(t.identifier('useState'), [defaultValueArgument])
    ),
  ])
}

export const convertToReactEventName = (str: string): string => 'on' + capitalize(str)
