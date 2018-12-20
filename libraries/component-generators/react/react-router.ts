import * as t from '@babel/types'

import { generateASTDefinitionForJSXTag } from '../pipeline/utils/jsx-ast'

import {
  ComponentPlugin,
  ComponentPluginFactory,
  RegisterDependency,
} from '../pipeline/types'
import { createPlugin as importStatements } from '../pipeline/plugins/common/import-statements'
import { ComponentAssemblyLine, Builder } from '../pipeline'
import { generateTreeStructure } from '../pipeline/plugins/react/react-base-component'

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
    const { resolver, registerDependency } = operations

    registerRouterDeps(registerDependency)

    const { states } = uidl
    const pages = states || {}

    const mappings: any = {
      routes: [],
    }

    const componentChunkNamesBeforeRouteChunk: string[] = []

    const rootRouterTag = generateASTDefinitionForJSXTag('Router')
    const routeDefinitions = Object.keys(pages).map((pageKey) => {
      const { component: stateComponent, default: isDefault, meta } = pages[pageKey]
      const { name, content } = stateComponent
      const { type, attrs, dependency, children } = content
      const mappedElement = resolver(type, attrs, dependency)
      const route = generateASTDefinitionForJSXTag('Route')
      const path = meta && meta.url ? meta.url : pageKey
      const urlRoute = isDefault ? '/' : `/${path.toLocaleLowerCase()}`
      const withInlineComponent = children && children.length
      if (withInlineComponent) {
        const nodesLookup = {}
        const jsxTagStructure = generateTreeStructure(
          content,
          {}, // TODO: add state definitions here
          nodesLookup,
          resolver,
          (a, b) => {
            const filePath = b.path || ''
            b = {
              ...b,
              path: `./components/${filePath.replace('./', '')}`,
              meta: {
                ...b.meta,
              },
            }
            return registerDependency(a, b)
          }
        )

        const generatedPageInstance = makePureComponent({
          name: `${name}Page`,
          jsxTagTree: jsxTagStructure,
        })

        const inlinePageComponentChunkName = `${componentChunkName}-${name}`
        structure.chunks.push({
          type: 'js',
          name: inlinePageComponentChunkName,
          linker: {
            after: [importChunkName],
          },
          meta: {
            nodesLookup,
          },
          content: generatedPageInstance,
        })
        componentChunkNamesBeforeRouteChunk.push(inlinePageComponentChunkName)
      } else {
        registerDependency(mappedElement.nodeName, {
          type: 'local',
          path: `./components/${mappedElement.nodeName}`,
        })
      }

      route.openingElement.attributes.push(
        t.jsxAttribute(t.jsxIdentifier('exact')),
        t.jsxAttribute(t.jsxIdentifier('path'), t.stringLiteral(urlRoute)),
        t.jsxAttribute(
          t.jsxIdentifier('component'),
          t.jsxExpressionContainer(
            t.identifier(withInlineComponent ? `${name}Page` : mappedElement.nodeName)
          )
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
        after: [importChunkName, ...componentChunkNamesBeforeRouteChunk],
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

export const configureRouterAsemblyLine = () => {
  const configureAppRouterComponent = createPlugin({
    componentChunkName: 'app-router-component',
    domRenderChunkName: 'app-router-export',
    importChunkName: 'import',
  })

  const configureImportStatements = importStatements({
    importLibsChunkName: 'import',
  })

  const generateComponent = async (jsDoc: any) => {
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
