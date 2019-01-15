import * as t from '@babel/types'

import { generateASTDefinitionForJSXTag } from '../utils/jsx-ast'

import { ComponentPlugin, ComponentPluginFactory, RegisterDependency } from '../types'
import { createPlugin as importStatements } from '../plugins/common/import-statements'
import { ComponentAssemblyLine, Builder } from '../pipeline'

import { extractPageMetadata } from '../../project-generators/utils/generator-utils'

import { ComponentUIDL } from '../../uidl-definitions/types'
import htmlMapping from '../../uidl-definitions/elements-mapping/html-mapping.json'
import reactMapping from './elements-mapping.json'

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

const registerRouterDeps = (registerDependency: RegisterDependency): void => {
  registerDependency('React', {
    type: 'library',
    path: 'react',
    version: '16.6.3',
  })

  registerDependency('ReactDOM', {
    type: 'library',
    path: 'react-dom',
    version: '16.6.3',
  })

  registerDependency('Router', {
    type: 'library',
    path: 'react-router-dom',
    version: '4.3.1',
    meta: {
      namedImport: true,
      originalName: 'BrowserRouter',
    },
  })

  registerDependency('Route', {
    type: 'library',
    path: 'react-router-dom',
    version: '4.3.1',
    meta: {
      namedImport: true,
    },
  })
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
    const { registerDependency } = operations

    registerRouterDeps(registerDependency)

    const { content, stateDefinitions = {} } = uidl
    const { states: pages = [] } = uidl.content
    const { router: routerDefinitions } = stateDefinitions

    const routeJSXDefinitions = pages.map((page) => {
      const { value: pageKey } = page

      if (typeof pageKey !== 'string' || typeof content === 'string') {
        console.warn(
          'Route not correctly specified. Value should be a string when defining routes'
        )
        return null
      }

      const { fileName, componentName, path } = extractPageMetadata(
        routerDefinitions,
        pageKey
      )
      const route = generateASTDefinitionForJSXTag('Route')

      registerDependency(componentName, {
        type: 'local',
        path: `./pages/${fileName}`,
      })

      route.openingElement.attributes.push(
        t.jsxAttribute(t.jsxIdentifier('exact')),
        t.jsxAttribute(t.jsxIdentifier('path'), t.stringLiteral(path)),
        t.jsxAttribute(
          t.jsxIdentifier('component'),
          t.jsxExpressionContainer(t.identifier(componentName))
        )
      )

      return route
    })

    const rootRouterTag = generateASTDefinitionForJSXTag('Router')

    const divContainer = generateASTDefinitionForJSXTag('div')

    rootRouterTag.children.push(divContainer)

    routeJSXDefinitions.forEach((route) => {
      if (route) {
        divContainer.children.push(route)
      }
    })

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

export const configureRouterAsemblyLine = () => {
  const configureAppRouterComponent = createPlugin({
    componentChunkName: 'app-router-component',
    domRenderChunkName: 'app-router-export',
    importChunkName: 'import',
  })

  const configureImportStatements = importStatements({
    importLibsChunkName: 'import',
  })

  const generateComponent = async (jsDoc: ComponentUIDL) => {
    const asemblyLine = new ComponentAssemblyLine(
      [configureAppRouterComponent, configureImportStatements],
      {
        ...htmlMapping,
        ...reactMapping,
      }
    )

    const result = await asemblyLine.run(jsDoc)
    const chunksLinker = new Builder()

    return {
      code: chunksLinker.link(result.chunks),
      dependencies: result.dependencies,
    }
  }

  return generateComponent
}
