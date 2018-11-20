// tslint:disable-next-line
import * as prettier from 'prettier/standalone'

// STILL NEEDED BECAUSE SOME JSX TAG SYNTAX BREAKS WITH OUR AST...
import parserPlugin from 'prettier/parser-babylon'

import { ComponentPlugin } from '../../types'
/**
 * Link the given structure chunks into a file/files which will represent the
 * actual react component.
 *
 * @param structure : ComponentStructure
 */
const prettierPostPlugin: ComponentPlugin = async (structure) => {
  // inject our AST into prettier, by faking a parser implementation and
  // sending a empty string to prettier. Prettier won't parse anything,
  // we will send the AST we generated, and prettier will then apply
  // the formatiing on our AST.
  const codeChunk = structure.chunks.find((chunk) => chunk.type === 'string')
  if (!codeChunk) {
    return
  }

  const formatted = prettier.format(codeChunk.content, {
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    semi: false,
    singleQuote: false,
    trailingComma: 'none',
    bracketSpacing: true,
    jsxBracketSameLine: false,

    parser: 'babylon',
    plugins: [parserPlugin],
  })

  structure.chunks.push({
    type: 'string',
    meta: {
      usage: 'react-component-file',
    },
    content: formatted,
  })

  return structure
}

export default prettierPostPlugin
