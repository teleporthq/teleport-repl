import preset from 'jss-preset-default'
import jss from 'jss'
jss.setup(preset())

import { ComponentPlugin } from '../../types'

import { addClassStringOnJSXTag, generateStyledJSXTag } from '../../utils/jsx-ast'

import { cammelCaseToDashCase } from '../../utils/helpers'

const generateStyledJSXString = (content: any, uidlMappings: any) => {
  let accumulator: any[] = []

  // only do stuff if content is a object
  if (content && typeof content === 'object') {
    const { style, children, name } = content
    if (style) {
      const root = uidlMappings[name]
      const className = cammelCaseToDashCase(name)
      accumulator.push(
        jss
          .createStyleSheet(
            {
              [`.${className}`]: style,
            },
            {
              generateClassName: () => className,
            }
          )
          .toString()
      )
      addClassStringOnJSXTag(root, className)
    }

    if (children && Array.isArray(children)) {
      children.forEach((child) => {
        const items = generateStyledJSXString(child, uidlMappings)
        accumulator = accumulator.concat(...items)
      })
    }
  }

  return accumulator
}

const reactStyledJSXChunkPlugin: ComponentPlugin = async (structure) => {
  const { uidl, chunks } = structure

  const { content } = uidl

  const jsxChunk = chunks.filter((chunk) => chunk.type === 'jsx')[0]
  const jsxChunkMappings = jsxChunk.meta.uidlMappings

  const styleJSXString = generateStyledJSXString(content, jsxChunkMappings)

  const jsxASTNodeReference = generateStyledJSXTag(styleJSXString.join('\n'))
  // We have the ability to insert the tag into the existig JSX structure, or
  // do something else with it. For now, to move faster, we'll add it to the existing
  // ast structure directly.

  // we have in the mappings references to JSXTags (see project class implementation)
  // these instances of JSXTag have a node reference which is the AST implementation
  // of a BabelTypes.JSXElement. Not ideal, I know. Maybe we can do something about
  // this kind of dereferencing in the future.
  jsxChunkMappings[content.name].children.push(jsxASTNodeReference)

  return structure
}

export default reactStyledJSXChunkPlugin
