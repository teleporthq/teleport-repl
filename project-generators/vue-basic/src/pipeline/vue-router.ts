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

    const { states } = uidl
    const routesAST = Object.keys(states).map((key) => {
      const state = states[key]
      const { name, type } = state.content
      const path = state.default ? '/' : '/' + key.toLowerCase()

      registerDependency(type, { type: 'local', meta: { path: `./components/${type}` } })

      return t.objectExpression([
        t.objectProperty(t.identifier('name'), t.stringLiteral(name)),
        t.objectProperty(t.identifier('path'), t.stringLiteral(path)),
        t.objectProperty(t.identifier('component'), t.identifier(type)),
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

const createVuePipeline = () => {
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

  const componentGenerator = async (componentUIDL) => {
    const result = await asemblyLine.run(componentUIDL)
    const code = chunksLinker.link(result.chunks)

    return {
      code,
      dependencies: result.dependencies,
    }
  }

  return componentGenerator
}

export default createVuePipeline
