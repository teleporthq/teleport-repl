import * as t from '@babel/types'
import { ComponentPluginFactory, ComponentPlugin } from '../../types'

interface VueRouterConfig {
  codeChunkName: string
  importChunkName: string
}

export const createPlugin: ComponentPluginFactory<VueRouterConfig> = (config) => {
  const { codeChunkName = 'vue-router', importChunkName = 'import-lib' } = config || {}

  const vueRouterComponentPlugin: ComponentPlugin = async (structure, operations) => {
    const { chunks, uidl } = structure
    const { registerDependency } = operations

    registerDependency('Vue', {
      type: 'library',
      path: 'vue',
    })
    registerDependency('Router', {
      type: 'library',
      path: 'vue-router',
    })

    const declaration = t.expressionStatement(
      t.callExpression(t.identifier('Vue.use'), [t.identifier('Router')])
    )

    const { states } = uidl
    const routesAST = Object.keys(states).map((key) => {
      const state = states[key]
      const routeComponent = state.component
      const { name } = routeComponent
      const pageUrl = state.meta && state.meta.url ? state.meta.url : key

      // Should default override the meta / url?
      // TODO: Extract to function? similar to nuxt filename
      const routePath = state.default ? '/' : `/${pageUrl}`

      registerDependency(name, { type: 'local', path: `./views/${name}` })

      return t.objectExpression([
        t.objectProperty(t.identifier('name'), t.stringLiteral(name)),
        t.objectProperty(t.identifier('path'), t.stringLiteral(routePath)),
        t.objectProperty(t.identifier('component'), t.identifier(name)),
      ])
    })

    const exportStatement = t.exportDefaultDeclaration(
      t.newExpression(t.identifier('Router'), [
        t.objectExpression([
          t.objectProperty(t.identifier('mode'), t.stringLiteral('history')),
          t.objectProperty(t.identifier('routes'), t.arrayExpression(routesAST)),
        ]),
      ])
    )

    chunks.push({
      name: codeChunkName,
      linker: {
        after: [importChunkName],
      },
      type: 'js',
      content: [declaration, exportStatement],
    })

    return structure
  }

  return vueRouterComponentPlugin
}
