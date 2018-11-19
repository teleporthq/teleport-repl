import * as t from '@babel/types'

import { ComponentPlugin } from '../../types'
import { objectToObjectExpression } from '../../../react/JSXTag/utils'
import {
  addClassStringOnJSXTag,
  addDynamicPropOnJsxOpeningTag,
} from '../../utils/jsx-ast'
import { makeConstAssign, makeDefaultImportStatement } from '../../utils/js-ast'
import { cammelCaseToDashCase } from '../../utils/helpers'

const generateStyleTagStrings = (content: any, uidlMappings: any) => {
  let accumulator: { [key: string]: any } = {}
  // only do stuff if content is a object
  if (content && typeof content === 'object') {
    const { style, children, name } = content
    if (style) {
      const root = uidlMappings[name]
      const className = cammelCaseToDashCase(name)
      accumulator[className] = style
      // addClassStringOnJSXTag(root.node, className)
      addDynamicPropOnJsxOpeningTag(root.node, 'className', `classes.${className}`)
    }

    if (children && Array.isArray(children)) {
      children.forEach((child) => {
        const items = generateStyleTagStrings(child, uidlMappings)
        accumulator = {
          ...accumulator,
          ...items,
        }
      })
    }
  }

  return accumulator
}

const reactJSSComponentStyleChunksPlugin: ComponentPlugin = async (structure) => {
  const { uidl, chunks } = structure

  const { content } = uidl

  const templateChunk = chunks.filter((chunk) => chunk.type === 'jsx')[0]
  const jsxChunkMappings = templateChunk.meta.uidlMappings

  const jssStyleMap = generateStyleTagStrings(content, jsxChunkMappings)

  chunks.push({
    type: 'js',
    meta: {
      usage: 'react-jss-style-object',
    },
    content: makeConstAssign('styles', objectToObjectExpression(t, jssStyleMap)),
  })

  // TODO, discuss.
  // should we make the import statement here, or just define a flow of registering
  // required dependecies and have the linker create the import statements?
  chunks.push({
    type: 'js',
    meta: {
      usage: 'import',
      requiredPackages: ['react-jss'],
    },
    content: makeDefaultImportStatement('injectSheet', 'react-jss'),
  })

  return structure
}

export default reactJSSComponentStyleChunksPlugin
