import { ComponentPlugin, ComponentPluginFactory } from '../../types'
import { addDynamicPropOnJsxOpeningTag } from '../../utils/jsx-ast'
import {
  makeConstAssign,
  makeJSSDefaultExport,
  objectToObjectExpression,
} from '../../utils/js-ast'
import { cammelCaseToDashCase } from '../../utils/helpers'

const generateStyleTagStrings = (content: any, nodesLookup: any) => {
  let accumulator: { [key: string]: any } = {}
  // only do stuff if content is a object
  if (content && typeof content === 'object') {
    const { style, children, name } = content
    if (style) {
      const root = nodesLookup[name]
      const className = cammelCaseToDashCase(name)
      accumulator[className] = style
      // addClassStringOnJSXTag(root.node, className)
      addDynamicPropOnJsxOpeningTag(root, 'className', `classes['${className}']`)
    }

    if (children && Array.isArray(children)) {
      children.forEach((child) => {
        const items = generateStyleTagStrings(child, nodesLookup)
        accumulator = {
          ...accumulator,
          ...items,
        }
      })
    }
  }

  return accumulator
}

interface JSSConfig {
  styleChunkName?: string
  importChunkName?: string
  componentChunkName: string
  exportChunkName: string
  jssDeclarationName?: string
}
export const createPlugin: ComponentPluginFactory<JSSConfig> = (config) => {
  const {
    componentChunkName = 'react-component',
    importChunkName = 'import',
    styleChunkName = 'jss-style-definition',
    exportChunkName = 'export',
    jssDeclarationName = 'style',
  } = config || {}

  const reactJSSComponentStyleChunksPlugin: ComponentPlugin = async (
    structure,
    operations
  ) => {
    const { uidl, chunks } = structure
    const { registerDependency } = operations

    const { content } = uidl

    const componentChunk = chunks.find((chunk) => chunk.name === componentChunkName)
    if (!componentChunk) {
      return structure
    }

    const jsxNodesLookup = componentChunk.meta.nodesLookup

    const jssStyleMap = generateStyleTagStrings(content, jsxNodesLookup)

    if (!Object.keys(jssStyleMap).length) {
      // if no styles are defined, no need to build the jss style at all
      return structure
    }

    registerDependency('injectSheet', {
      type: 'library',
      meta: {
        path: 'react-jss',
      },
    })

    chunks.push({
      type: 'js',
      name: styleChunkName,
      linker: {
        after: [importChunkName],
      },
      content: makeConstAssign(jssDeclarationName, objectToObjectExpression(jssStyleMap)),
    })

    const exportChunk = chunks.find((chunk) => chunk.name === exportChunkName)

    const exportStatement = makeJSSDefaultExport(uidl.name, jssDeclarationName)

    if (exportChunk) {
      exportChunk.content = exportStatement
      if (exportChunk.linker && exportChunk.linker.after) {
        exportChunk.linker.after.push(styleChunkName)
      } else {
        exportChunk.linker = exportChunk.linker || {}
        exportChunk.linker.after = [importChunkName, styleChunkName]
      }
    } else {
      chunks.push({
        type: 'js',
        name: exportChunkName,
        content: exportStatement,
        linker: {
          after: [importChunkName, styleChunkName],
        },
      })
    }

    return structure
  }

  return reactJSSComponentStyleChunksPlugin
}

export default createPlugin()
