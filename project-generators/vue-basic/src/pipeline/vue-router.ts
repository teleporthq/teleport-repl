import * as t from '@babel/types'
import ComponentAsemblyLine from '../../../../utils/experimental-generators/pipeline/asembly-line'
import Builder from '../../../../utils/experimental-generators/pipeline/builder'

import { createPlugin as createImportPlugin } from '../../../../utils/experimental-generators/pipeline/plugins/common/import-statements'

import {
  ComponentPluginFactory,
  ComponentPlugin,
} from '../../../../utils/experimental-generators/pipeline/types'

interface VueRouterConfig {
  codeChunkName: string
  importChunkName: string
}

const vueRouterPlugin: ComponentPluginFactory<VueRouterConfig> = (config) => {
  const { codeChunkName = 'vue-router', importChunkName = 'import-lib' } = config || {}

  const vueRouterComponentPlugin: ComponentPlugin = async (structure, operations) => {
    const { chunks, uidl } = structure
    const { registerDependency } = operations

    registerDependency('Vue', {
      type: 'library',
      meta: { path: 'vue', version: '^2.5.17' },
    })
    registerDependency('Router', {
      type: 'library',
      meta: { path: 'vue-router', version: '^3.0.1' },
    })

    const declaration = t.expressionStatement(
      t.callExpression(t.identifier('Vue.use'), [t.identifier('Router')])
    )

    const { root } = uidl
    const { states } = root
    const routesAST = Object.keys(states).map((key) => {
      const state = states[key]
      const routeComponent = state.component
      const { name } = routeComponent
      const pageUrl = state.meta && state.meta.url ? state.meta.url : `/${key}`

      // Should default override the meta / url?
      // TODO: Extract to function? similar to nuxt filename
      const routePath = state.default ? '/' : pageUrl

      registerDependency(name, { type: 'local', meta: { path: `./views/${name}` } })

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

const createVuePipeline = (customMappings?: any) => {
  const asemblyLine = new ComponentAsemblyLine('vue', [
    vueRouterPlugin({
      codeChunkName: 'vue-router',
      importChunkName: 'import-lib',
    }),
    createImportPlugin({
      importLibsChunkName: 'import-lib',
    }),
  ])

  const chunksLinker = new Builder()

  const componentGenerator = async (componentUIDL: any) => {
    const result = await asemblyLine.run(componentUIDL, { customMappings })
    const code = chunksLinker.link(result.chunks)

    return {
      code,
      dependencies: result.dependencies,
    }
  }

  return componentGenerator
}

export default createVuePipeline
