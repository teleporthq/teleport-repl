import { ComponentPlugin } from '../../types'

import * as t from '@babel/types'

const makePureComponent = (params: { name: string; jsxTagTree: any }) => {
  const { name, jsxTagTree } = params
  const returnStatement = t.returnStatement(jsxTagTree)
  const arrowFunction = t.arrowFunctionExpression([t.identifier('props')], t.blockStatement([returnStatement] || []))

  const declarator = t.variableDeclarator(t.identifier(name), arrowFunction)
  const component = t.variableDeclaration('const', [declarator])

  return { component, returnStatement }
}

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
    meta: {
      usage: 'react-pure-component',
    },
    content: emptyPureComponent,
  })

  return structure
}

export default reactPureComponentPlugin
