import * as t from '@babel/types'

import ComponentAsemblyLine from '../../../utils/experimental-generators/pipeline/asembly-line'
import Builder from '../../../utils/experimental-generators/pipeline/builder'

import { createPlugin as reactPropTypes } from '../../../utils/experimental-generators/pipeline/plugins/react/react-proptypes'
import { createPlugin as importStatements } from '../../../utils/experimental-generators/pipeline/plugins/common/import-statements'
import {
  ComponentPluginFactory,
  ComponentPlugin,
} from '../../../utils/experimental-generators/pipeline/types'
import { generateASTDefinitionForJSXTag } from '../../../utils/experimental-generators/pipeline/utils/jsx-ast'
import { makeDefaultExport } from '../../../utils/experimental-generators/pipeline/utils/js-ast'

const makePureComponent = (params: { name: string; jsxTagTree: t.JSXElement }) => {
  const { name, jsxTagTree } = params
  const returnStatement = t.returnStatement(jsxTagTree)
  const arrowFunction = t.arrowFunctionExpression(
    [t.identifier('props')],
    t.blockStatement([returnStatement] || [])
  )

  const declarator = t.variableDeclarator(t.identifier(name), arrowFunction)
  const component = t.variableDeclaration('const', [declarator])

  return component
}

interface NextpageComponentConfig {
  componentChunkName?: string
  importChunkName?: string
  exportChunkName?: string
}

export const createPlugin: ComponentPluginFactory<NextpageComponentConfig> = (config) => {
  const {
    importChunkName = 'imports',
    exportChunkName = 'page-export',
    componentChunkName = 'next-page-component',
  } = config || {}

  const reactAppRoutingComponentPlugin: ComponentPlugin = async (
    structure,
    operations
  ) => {
    const { uidl } = structure
    const { resolver, registerDependency } = operations

    const { content } = uidl

    const { type, attrs, dependency } = content
    const mappedElement = resolver(type, attrs, dependency)
    registerDependency(mappedElement.nodeName, {
      type: 'local',
      meta: {
        path: `../components/${mappedElement.nodeName}`,
      },
    })

    const pageName = `${mappedElement.nodeName}Page`
    const pureComponent = makePureComponent({
      name: pageName,
      jsxTagTree: generateASTDefinitionForJSXTag(mappedElement.nodeName),
    })

    structure.chunks.push({
      type: 'js',
      name: componentChunkName,
      linker: {
        after: [importChunkName],
      },
      content: pureComponent,
    })

    structure.chunks.push({
      type: 'js',
      name: exportChunkName,
      linker: {
        after: [componentChunkName],
      },
      content: makeDefaultExport(pageName),
    })

    return structure
  }

  return reactAppRoutingComponentPlugin
}

export const configureNextPageAsemblyLine = () => {
  const configuredReactComponent = createPlugin({
    componentChunkName: 'next-page-component',
    importChunkName: 'import',
  })

  const configuredPropTypes = reactPropTypes({
    componentChunkName: 'next-page-component',
  })

  const configureImportStatements = importStatements({
    importLocalsChunkName: 'import',
  })

  const generateComponentChunks = async (jsDoc: any) => {
    const asemblyLine = new ComponentAsemblyLine('react', [
      configuredReactComponent,
      configuredPropTypes,
      configureImportStatements,
    ])

    const chunksLinker = new Builder()
    const result = await asemblyLine.run(jsDoc)
    const code = chunksLinker.link(result.chunks)
    return {
      ...result,
      code,
    }
  }

  return generateComponentChunks
}
