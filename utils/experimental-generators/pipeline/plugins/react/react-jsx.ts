import JSXTag from '../../../react/JSXTag'

import { ComponentPlugin } from '../../types'

const generateTreeStructure = (content: any): JSXTag => {
  const { type, children } = content
  const mappedType = type === 'Text' ? 'span' : 'div'
  const mainTag = new JSXTag(mappedType)

  if (children) {
    if (Array.isArray(children)) {
      children.forEach((child) => {
        if (!child) {
          return
        }
        const newTag = generateTreeStructure(child)
        if (!newTag) {
          return
        }
        mainTag.addChildJSXTag(newTag.node)
      })
    } else {
      mainTag.addChildJSXText(children.toString())
    }
  }

  return mainTag
}

const reactJSXPlugin: ComponentPlugin = async (structure) => {
  const { uidl } = structure

  const jsxTagStructure = generateTreeStructure(uidl.content)

  structure.chunks.push({
    type: 'jsx',
    meta: {
      usage: 'react-component-jsx',
    },
    content: jsxTagStructure,
  })
  return structure
}

export default reactJSXPlugin
