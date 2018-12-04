import * as t from '@babel/types'

import { generateASTDefinitionForJSXTag } from '../../../utils/experimental-generators/pipeline/utils/jsx-ast'

import {
  ComponentPlugin,
  ComponentPluginFactory,
} from '../../../utils/experimental-generators/pipeline/types'

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
  domRenderChunkName: string
  importChunkName: string
}

export const createPlugin: ComponentPluginFactory<AppRoutingComponentConfig> = (
  config
) => {
  const {
    importChunkName = 'imports',
    componentChunkName = 'app-routing-component',
    domRenderChunkName = 'app-routing-bind-to-dom',
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
        version: '16.6.1',
      },
    })

    registerDependency('ReactDOM', {
      type: 'library',
      meta: {
        path: 'react-dom',
        version: '16.6.1',
      },
    })

    registerDependency('Router', {
      type: 'library',
      meta: {
        path: 'react-router-dom',
        namedImport: true,
        originalName: 'BrowserRouter',
        version: '4.3.1',
      },
    })

    registerDependency('Route', {
      type: 'library',
      meta: {
        path: 'react-router-dom',
        namedImport: true,
        version: '4.3.1',
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

        const urlRoute =
          pages.default === pageKey ? '/' : `/${pageKey.toLocaleLowerCase()}`

        registerDependency(mappedElement.nodeName, {
          type: 'local',
          meta: {
            path: `./components/${mappedElement.nodeName}`,
          },
        })

        route.openingElement.attributes.push(
          t.jsxAttribute(t.jsxIdentifier('exact')),
          t.jsxAttribute(t.jsxIdentifier('path'), t.stringLiteral(urlRoute))
        )

        route.openingElement.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier('component'),
            t.jsxExpressionContainer(t.identifier(mappedElement.nodeName))
          )
        )

        return route
      })

    const divContainer = generateASTDefinitionForJSXTag('div')

    rootRouterTag.children.push(divContainer)

    divContainer.children.push(...routeDefinitions)

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

    // makes ReactDOM.render(AppName, document.getElementById('root'));
    const reactDomBind = t.expressionStatement(
      t.callExpression(
        t.memberExpression(t.identifier('ReactDOM'), t.identifier('render')),
        [
          generateASTDefinitionForJSXTag(uidl.name),
          t.callExpression(
            t.memberExpression(t.identifier('document'), t.identifier('getElementById')),
            [t.stringLiteral('root')]
          ),
        ]
      )
    )

    structure.chunks.push({
      type: 'js',
      name: domRenderChunkName,
      linker: {
        after: [componentChunkName],
      },
      content: reactDomBind,
    })

    return structure
  }

  return reactAppRoutingComponentPlugin
}

export default createPlugin()
