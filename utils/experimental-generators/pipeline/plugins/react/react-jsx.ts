import JSXTag from '../../../react/JSXTag'

import { ComponentPlugin } from '../../types'

const generateTreeStructure = (content: any, uidlMappings: any = {}): JSXTag => {
  const { type, children, name } = content
  const mappedType = type === 'Text' ? 'span' : 'div'
  const mainTag = new JSXTag(mappedType)

  if (children) {
    if (Array.isArray(children)) {
      children.forEach((child) => {
        if (!child) {
          return
        }
        const newTag = generateTreeStructure(child, uidlMappings)
        if (!newTag) {
          return
        }
        mainTag.addChildJSXTag(newTag.node)
      })
    } else {
      mainTag.addChildJSXText(children.toString())
    }
  }

  // UIDL name should be unique
  uidlMappings[name] = mainTag

  return mainTag
}

const reactJSXPlugin: ComponentPlugin = async (structure) => {
  const { uidl } = structure

  // We will keep a flat mapping object from each component identifier (from the UIDL) to its correspoding JSX AST Tag
  // This will help us inject style or classes at a later stage in the pipeline, upon traversing the UIDL
  // The structure will be populated as the AST is being created
  const uidlMappings = {}
  const jsxTagStructure = generateTreeStructure(uidl.content, uidlMappings)

  structure.chunks.push({
    type: 'jsx',
    meta: {
      usage: 'react-component-jsx',
      uidlMappings,
    },
    content: jsxTagStructure,
  })
  return structure
}

export default reactJSXPlugin
