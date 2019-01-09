import * as types from '@babel/types'

import preset from 'jss-preset-default'
import jss from 'jss'
jss.setup(preset())

import { cammelCaseToDashCase, stringToCamelCase } from '../../../pipeline/utils/helpers'
import {
  addJSXTagStyles,
  addExternalPropOnJsxOpeningTag,
} from '../../../pipeline/utils/jsx-ast'
import { ParsedASTNode } from '../../../pipeline/utils/js-ast'

import { ComponentContent } from '../../../../uidl-definitions/types'

export const splitDynamicAndStaticProps = (style: Record<string, any>) => {
  return Object.keys(style).reduce(
    (
      acc: { staticStyles: Record<string, any>; dynamicStyles: Record<string, any> },
      key
    ) => {
      const value = style[key]
      if (typeof value === 'string' && value.startsWith('$props.')) {
        acc.dynamicStyles[key] = value.replace('$props.', '')
      } else {
        acc.staticStyles[key] = value
      }
      return acc
    },
    { staticStyles: {}, dynamicStyles: {} }
  )
}

export const prepareDynamicProps = (style: any, t = types) => {
  return Object.keys(style).reduce((acc: any, key) => {
    const value = style[key]
    acc[key] = new ParsedASTNode(
      t.memberExpression(
        t.identifier('props'),
        t.identifier(value.replace('$props.', ''))
      )
    )
    return acc
  }, {})
}

interface ApplyCSSModulesAndGetDeclarationsParams {
  nodesLookup: Record<string, types.JSXElement>
  camelCaseClassNames: boolean
}

export const applyCSSModulesAndGetDeclarations = (
  content: ComponentContent,
  params: ApplyCSSModulesAndGetDeclarationsParams,
  t = types
) => {
  let accumulator: any[] = []
  const { nodesLookup = {}, camelCaseClassNames } = params

  const { style, children, key, repeat } = content
  if (style) {
    const root = nodesLookup[key]
    const className = cammelCaseToDashCase(key)
    const classNameInJS = camelCaseClassNames ? stringToCamelCase(className) : className
    const { staticStyles, dynamicStyles } = splitDynamicAndStaticProps(style)

    // TODO Should we build a different plugin for dynamic props as inline styles?
    const inlineStyle = prepareDynamicProps(dynamicStyles)
    if (Object.keys(inlineStyle).length) {
      addJSXTagStyles(root, inlineStyle)
    }

    accumulator.push(
      jss
        .createStyleSheet(
          {
            [`.${className}`]: staticStyles,
          },
          {
            generateClassName: () => className,
          }
        )
        .toString()
    )

    const cssClassNameFromStylesObject = camelCaseClassNames
      ? `styles.${classNameInJS}`
      : `styles['${className}']`

    addExternalPropOnJsxOpeningTag(
      root,
      'className',
      t.identifier(cssClassNameFromStylesObject)
    )
  }

  if (repeat) {
    const items = applyCSSModulesAndGetDeclarations(repeat.content, params)
    accumulator = accumulator.concat(...items)
  }

  if (children) {
    children.forEach((child) => {
      // Inside the children array we can also encounter text elements
      if (typeof child === 'string') {
        return
      }

      const items = applyCSSModulesAndGetDeclarations(child, params)
      accumulator = accumulator.concat(...items)
    })
  }

  return accumulator
}
