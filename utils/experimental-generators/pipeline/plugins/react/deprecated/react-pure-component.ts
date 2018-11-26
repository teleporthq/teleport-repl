import { ComponentPlugin, ComponentPluginFactory } from '../../../types'

import * as t from '@babel/types'
import { makeDefaultExport } from '../../../utils/js-ast'

const makePureComponent = (params: { name: string; jsxTagTree: any }) => {
  const { name, jsxTagTree } = params
  const returnStatement = t.returnStatement(jsxTagTree)
  const arrowFunction = t.arrowFunctionExpression(
    [t.identifier('props')],
    t.blockStatement([returnStatement] || [])
  )

  const declarator = t.variableDeclarator(t.identifier(name), arrowFunction)
  const component = t.variableDeclaration('const', [declarator])

  return { component, returnStatement }
}

interface PureComponentConfig {
  componentChunkName: string
  exportChunkName: string
}
export const createPlugin: ComponentPluginFactory<PureComponentConfig> = (config) => {
  const { componentChunkName = 'react-pure-component', exportChunkName = 'main-export' } =
    config || {}

  /**
   * Generate a pure react component structure, without the JSX returned from inside
   * with the name and details present in the uidl of this component
   *
   * @param structure : ComponentStructure
   */
  const reactPureComponentPlugin: ComponentPlugin = async (structure) => {
    const { uidl } = structure

    const emptyPureComponent = makePureComponent({
      name: uidl.name,
      jsxTagTree: null,
    })

    structure.chunks.push({
      type: 'js',
      name: componentChunkName,
      linker: {
        slots: {
          'componet-jsx': (chunks) => {
            if (chunks.length > 1) {
              throw new Error('Only one jsx chunk can be inserted into componet-jsx slot')
            }
            emptyPureComponent.returnStatement.argument = chunks[0].content
          },
        },
      },
      meta: {
        usage: componentChunkName,
        mappings: {
          returnStatement: emptyPureComponent.returnStatement,
        },
      },
      content: emptyPureComponent.component,
    })

    structure.chunks.push({
      type: 'js',
      linker: {
        after: [componentChunkName],
      },
      meta: {},
      name: exportChunkName,
      content: makeDefaultExport(uidl.name),
    })

    return structure
  }

  return reactPureComponentPlugin
}

export default createPlugin()
