import * as t from '@babel/types'
import generator from '@babel/generator'
import * as prettier from 'prettier/standalone'

import cheerio from 'cheerio'

// STILL NEEDED BECAUSE SOME JSX TAG SYNTAX BREAKS WITH OUR AST...
import parserPlugin from 'prettier/parser-babylon'
import parserPluginHtml from 'prettier/parser-html'

import { buildEmptyVueJSExport } from './utils'
import { VueTag } from './VueTag'

const makeEmptyAST = () => {
  return t.file(t.program([]), null, [])
}

const generateJSCode = (jsDoc: any) => {
  const componentName = jsDoc.name
  const astFile = makeEmptyAST()
  const vueJSExport = buildEmptyVueJSExport(t, { name: componentName })

  astFile.program.body.push(vueJSExport)

  const oneLinerCode = generator(astFile).code

  // inject our AST into prettier, by faking a parser implementation and
  // sending a empty string to prettier. Prettier won't parse anything,
  // we will send the AST we generated, and prettier will then apply
  // the formatiing on our AST.
  const formatted = prettier.format(oneLinerCode, {
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

  return formatted
}

const generateTemplateCode = (jsDoc: any) => {
  const { type, children, style } = jsDoc
  const mappedType = type === 'Text' ? 'span' : 'div'
  const mainTag = new VueTag(mappedType)

  // if (style) {
  //   mainTag.addInlineStyle(style);
  // }

  if (children) {
    if (Array.isArray(children)) {
      children.forEach((child) => {
        if (!child) {
          return
        }
        const newTag = generateTemplateCode(child)
        if (!newTag) {
          return
        }

        mainTag.node(mappedType).append(newTag)
      })
    } else {
      mainTag.node(mappedType).text(children.toString())
    }
  }

  mainTag.node(mappedType).addClass(type)
  mainTag.node(mappedType).attr('name', type)
  mainTag.node(mappedType).attr('vl:active', `{active: ${'true'}}`)

  const html = mainTag.node.html()

  const formatted = prettier.format(html, {
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

  return formatted
}

const genereateStyleTag = (_: any) => ''

const generateComponent = (jsDoc: any) => {
  const code = generateJSCode(jsDoc)
  const tempalte = generateTemplateCode(jsDoc.content)
  const style = genereateStyleTag(jsDoc)

  // could be managed by cherrio too, so we don't use a tempalte string here either
  return `
<template>
  ${tempalte}</template>
<script>
  ${code}</script>
<style>
  ${style}</style>
`
}

export { generateComponent }
