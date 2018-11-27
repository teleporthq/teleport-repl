import * as types from '@babel/types'

/**
 * Generate the AST version of
 * export default {
 *    name: "TestComponent",
 *    props: {  },
 *
 *
 *  }
 *
 * to be used by the vue generator.
 *
 * t is the @babel/types api, used to generate sections of AST
 *
 * params.name is the name of the component ('TestComponent' in the example above)
 */
export const buildEmptyVueJSExport = (t = types, params: { name: string }) => {
  return t.exportDefaultDeclaration(
    t.objectExpression([
      t.objectProperty(t.identifier('name'), t.stringLiteral(params.name)),
      t.objectProperty(t.identifier('props'), t.objectExpression([])),
    ])
  )
}
