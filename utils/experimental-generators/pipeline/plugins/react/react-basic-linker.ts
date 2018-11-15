import * as t from '@babel/types'
import generator from '@babel/generator'

import { ComponentPlugin } from '../../types'

const makeDefaultExportByName = (name: string) => {
  return t.exportDefaultDeclaration(t.identifier(name))
}

/**
 * Link the given structure chunks into a file/files which will represent the
 * actual react component.
 *
 * @param structure : ComponentStructure
 */
const reactStandardLinker: ComponentPlugin = async (structure) => {
  const { uidl, chunks } = structure
  const componentName = uidl.name

  const theJSXChunk = chunks.filter((chunk) => chunk.type === 'jsx' && chunk.meta.usage === 'react-component-jsx')[0]

  const theReactJSComponentChunk = chunks.filter((chunk) => chunk.type === 'js' && chunk.meta.usage === 'react-pure-component')[0]

  // injext in the return statement of the component ast the JSX chunk
  theReactJSComponentChunk.content.returnStatement.argument = theJSXChunk.content.node

  const ast2 = t.file(t.program([theReactJSComponentChunk.content.component, makeDefaultExportByName(componentName)]), null, [])

  const oneLinerCode = generator(ast2).code

  return oneLinerCode
}

export default reactStandardLinker
