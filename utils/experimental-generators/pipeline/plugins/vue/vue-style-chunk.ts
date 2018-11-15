import preset from 'jss-preset-default'
import jss from 'jss'
jss.setup(preset())

import { ComponentPlugin } from '../../types'

const generateStyleTagStrings = (content: any) => {
  let accumulator: any[] = []
  // only do stuff if content is a object
  if (content && typeof content === 'object') {
    const { style, children, name } = content
    if (style) {
      accumulator.push(
        jss
          .createStyleSheet(
            {
              [`.${name}`]: style,
            },
            {
              generateClassName: () => name,
            }
          )
          .toString()
      )
    }

    if (children && Array.isArray(children)) {
      children.forEach((child) => {
        const items = generateStyleTagStrings(child)
        accumulator = accumulator.concat(...items)
      })
    }
  }

  return accumulator
}

const vueComponentStyleChunkPlugin: ComponentPlugin = async (structure) => {
  const { uidl, chunks } = structure

  const { content } = uidl

  const jssStylesArray = generateStyleTagStrings(content)

  chunks.push({
    type: 'css',
    meta: {
      usage: 'vue-component-styles-string',
    },
    content: jssStylesArray.join('\n'),
  })

  return structure
}

export default vueComponentStyleChunkPlugin
