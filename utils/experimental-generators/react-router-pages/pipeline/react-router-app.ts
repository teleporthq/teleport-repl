import * as t from '@babel/types'

import { generateASTDefinitionForJSXTag } from '../../pipeline/utils/jsx-ast'

import { makeDefaultExport } from '../../pipeline/utils/js-ast'

import { ComponentPlugin, ComponentPluginFactory } from '../../pipeline/types'

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

interface AppRoutingComponentConfig {
  componentChunkName: string
  exportChunkName: string
  importChunkName: string
}

export const createPlugin: ComponentPluginFactory<AppRoutingComponentConfig> = (
  config
) => {
  const {
    importChunkName = 'imports',
    componentChunkName = 'app-routing-component',
    exportChunkName = 'app-routing-export',
  } = config || {}

  const reactAppRoutingComponentPlugin: ComponentPlugin = async (
    structure,
    operations
  ) => {
    const { uidl } = structure
    const { resolver, registerDependency } = operations

    registerDependency('React', {
      type: 'library',
      meta: {
        path: 'react',
      },
    })

    registerDependency(['Router', 'Route'], {
      type: 'library',
      meta: {
        path: 'react-router-dom',
        namedImport: true,
      },
    })

    const { states, content } = uidl
    const pages = states || {}

    if (content) {
      pages.default = 'index'
      pages.index = content
    }

    const mappings: any = {
      routes: [],
    }

    const rootRouterTag = generateASTDefinitionForJSXTag('Router')
    const routeDefinitions = Object.keys(pages)
      .filter((pageKey) => pageKey !== 'default')
      .map((pageKey) => {
        const { content: stateComponent } = pages[pageKey]
        const { type, attrs, dependency } = stateComponent
        const mappedElement = resolver(type, attrs, dependency)
        const route = generateASTDefinitionForJSXTag('Route')

        route.openingElement.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier('component'),
            t.jsxExpressionContainer(t.identifier(mappedElement.nodeName))
          )
        )

        return route
      })

    rootRouterTag.children.push(...routeDefinitions)
    mappings.routes = routeDefinitions

    const pureComponent = makePureComponent({
      name: uidl.name,
      jsxTagTree: rootRouterTag,
    })

    structure.chunks.push({
      type: 'js',
      name: componentChunkName,
      linker: {
        after: [importChunkName],
      },
      meta: {
        mappings,
      },
      content: pureComponent,
    })

    structure.chunks.push({
      type: 'js',
      name: exportChunkName,
      linker: {
        after: [componentChunkName],
      },
      content: makeDefaultExport(uidl.name),
    })

    return structure
  }

  return reactAppRoutingComponentPlugin
}

export default createPlugin()
