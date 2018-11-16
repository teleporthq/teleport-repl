import preset from 'jss-preset-default'
import jss from 'jss'
jss.setup(preset())

import { ComponentPlugin } from '../../types'

const nameToCSSClass = (name: string): string => {
  let ret = ''
  let prevLowercase = false

  for (const s of name) {
    const isUppercase = s.toUpperCase() === s
    if (isUppercase && prevLowercase) {
      ret += '-'
    }

    ret += s
    prevLowercase = !isUppercase
  }

  return ret.replace(/-+/g, '-').toLowerCase()
}

const generateStyleTagStrings = (content: any, uidlMappings: any) => {
  let accumulator: any[] = []
  // only do stuff if content is a object
  if (content && typeof content === 'object') {
    const { style, children, name } = content
    if (style) {
      const root = uidlMappings[name]
      const className = nameToCSSClass(name)
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

      root.addClass(className)
    }

    if (children && Array.isArray(children)) {
      children.forEach((child) => {
        const items = generateStyleTagStrings(child, uidlMappings)
        accumulator = accumulator.concat(...items)
      })
    }
  }

  return accumulator
}

const vueComponentStyleChunkPlugin: ComponentPlugin = async (structure) => {
  const { uidl, chunks } = structure

  const { content } = uidl

  const templateChunk = chunks.filter((chunk) => chunk.type === 'html')[0]
  const templateChunkMappings = templateChunk.meta.uidlMappings

  const jssStylesArray = generateStyleTagStrings(content, templateChunkMappings)

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
