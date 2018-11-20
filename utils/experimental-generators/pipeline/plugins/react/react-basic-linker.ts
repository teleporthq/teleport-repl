import * as t from '@babel/types'
import generator from '@babel/generator'

import { ComponentPlugin } from '../../types'
import { makeDefaultExport, makeJSSDefaultExport } from '../../utils/js-ast'

/**
 * Link the given structure chunks into a file/files which will represent the
 * actual react component.
 *
 * @param structure : ComponentStructure
 */
const reactStandardLinker: ComponentPlugin = async (structure) => {
  const { uidl, chunks } = structure
  const componentName = uidl.name

  const theJSXChunk = chunks.filter(
    (chunk) => chunk.type === 'jsx' && chunk.meta.usage === 'react-component-jsx'
  )[0]

  const theReactJSComponentChunk = chunks.filter(
    (chunk) => chunk.type === 'js' && chunk.meta.usage === 'react-pure-component'
  )[0]

  const theReactJSSComponentChunk = chunks.filter(
    (chunk) => chunk.type === 'js' && chunk.meta.usage === 'react-jss-style-object'
  )[0]

  const importStatements = chunks.filter(
    (chunk) => chunk.type === 'js' && chunk.meta.usage === 'import'
  )

  // injext in the return statement of the component ast the JSX chunk
  theReactJSComponentChunk.content.returnStatement.argument = theJSXChunk.content.node

  const contentInstructions = importStatements.map((chunk) => chunk.content)

  if (theReactJSSComponentChunk) {
    contentInstructions.push(theReactJSSComponentChunk.content)
    contentInstructions.push(theReactJSComponentChunk.content.component)
    contentInstructions.push(makeJSSDefaultExport(componentName, 'styles'))
  } else {
    contentInstructions.push(theReactJSComponentChunk.content.component)
    contentInstructions.push(makeDefaultExport(componentName))
  }

  const ast2 = t.file(t.program(contentInstructions), null, [])

  const oneLinerCode = generator(ast2).code

  chunks.push({
    type: 'string',
    meta: null,
    content: oneLinerCode,
  })

  return structure
}

export default reactStandardLinker
