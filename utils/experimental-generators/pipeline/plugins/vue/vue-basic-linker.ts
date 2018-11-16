import generator from '@babel/generator'

import * as prettier from 'prettier/standalone'
import parserPlugin from 'prettier/parser-babylon'
import parserPluginHtml from 'prettier/parser-html'

import { ComponentPlugin } from '../../types'

/**
 * Link the given structure chunks into a file/files which will represent the
 * actual vue component.
 *
 * @param structure : ComponentStructure
 */
const vueStandardLinker: ComponentPlugin = async (structure) => {
  const { chunks } = structure

  // ??? huh
  const templateChunk = chunks.filter((chunk) => chunk.type === 'html')[0]
  const javascriptChunk = chunks.filter((chunk) => chunk.type === 'js')[0]
  const cssChunk = chunks.filter((chunk) => chunk.type === 'css')[0]

  const oneLineCode = generator(javascriptChunk.content).code
  const oneLineHtml = templateChunk.content.html()

  const formattedCode = prettier.format(oneLineCode, {
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

  const formatedTemplate = prettier.format(oneLineHtml, {
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    semi: false,
    singleQuote: false,
    trailingComma: 'none',
    bracketSpacing: true,
    jsxBracketSameLine: false,

    parser: 'html',
    plugins: [parserPluginHtml],
  })

  const content = `
<template>

${formatedTemplate}
</template>  

<script>

${formattedCode}
</script>
${
    cssChunk && cssChunk.content
      ? `
<style>
${cssChunk.content}
</style>
`
      : ''
  }
`

  structure.chunks.push({
    type: 'string',
    meta: {
      usage: 'vue-component-file',
    },
    content,
  })

  return structure
}

export default vueStandardLinker
