import { ComponentPlugin, ComponentPluginFactory } from '../../types'
import { addDynamicPropOnJsxOpeningTag } from '../../utils/jsx-ast'
import {
  makeConstAssign,
  makeDefaultImportStatement,
  makeJSSDefaultExport,
  objectToObjectExpression,
} from '../../utils/js-ast'
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
      addDynamicPropOnJsxOpeningTag(root, 'className', `classes['${className}']`)
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

interface JSSConfig {
  styleChunkName?: string
  jssImportChunkName?: string
  componentChunkName: string
  exportChunkName: string
  jssDeclarationName?: string
}
export const createPlugin: ComponentPluginFactory<JSSConfig> = (config) => {
  const {
    componentChunkName = 'react-component',
    jssImportChunkName = 'import-jss',
    styleChunkName = 'jss-style-definition',
    exportChunkName = 'export',
    jssDeclarationName = 'style',
  } = config || {}

  const reactJSSComponentStyleChunksPlugin: ComponentPlugin = async (structure) => {
    const { uidl, chunks } = structure

    const { content } = uidl

    const componentChunk = chunks.find((chunk) => chunk.name === componentChunkName)
    if (!componentChunk) {
      return structure
    }

    const jsxChunkMappings = componentChunk.meta.uidlMappings

    const jssStyleMap = generateStyleTagStrings(content, jsxChunkMappings)

    // TODO, discuss.
    // should we make the import statement here, or just define a flow of registering
    // required dependecies and have the linker create the import statements?
    chunks.push({
      type: 'js',
      name: jssImportChunkName,
      content: makeDefaultImportStatement('injectSheet', 'react-jss'),
    })

    chunks.push({
      type: 'js',
      name: styleChunkName,
      linker: {
        after: [jssImportChunkName],
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
        exportChunk.linker.after = [jssImportChunkName, styleChunkName]
      }
    } else {
      chunks.push({
        type: 'js',
        name: exportChunkName,
        content: exportStatement,
        linker: {
          after: [jssImportChunkName, styleChunkName],
        },
      })
    }

    return structure
  }

  return reactJSSComponentStyleChunksPlugin
}

export default createPlugin()
