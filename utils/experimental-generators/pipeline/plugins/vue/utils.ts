import * as types from '@babel/types'
import cheerio from 'cheerio'

import { buildEmptyVueJSExport } from '../../../vue/utils'

export const generateSingleVueNode = (params: {
  tagName: string
  selfClosing?: boolean
}): CheerioStatic => {
  const emptyDeclaration = params.selfClosing
    ? `<${params.tagName}/>`
    : `<${params.tagName}> </${params.tagName}>`
  return cheerio.load(emptyDeclaration, {
    xmlMode: true, // otherwise the .html returns a <html><body> thing
    decodeEntities: false, // otherwise we can't set objects like `{ 'text-danger': hasError }`
    // without having them escaped with &quote; and stuff
  })
}

/**
 * TODO: Remove and favor declared dynamic props in prop definitions, not in
 * this type of filtering where we decide soemthing is dynamic only when it is used
 */
export const splitProps = (props: {
  [key: string]: any
}): { staticProps: any; dynamicProps: any } => {
  return Object.keys(props).reduce(
    (newMap: { staticProps: any; dynamicProps: any }, key) => {
      const keyName = props[key].startsWith('$props') ? 'dynamicProps' : 'staticProps'
      newMap[keyName][key] = props[key]
      return newMap
    },
    { staticProps: {}, dynamicProps: {} }
  )
}

/**
 * TODO: Remove the replacement of $props. when we switch to defined dynamic props
 */
export const addDynamicTemplateBinds = (
  root: Cheerio,
  attrs: { [key: string]: string }
) => {
  Object.keys(attrs).forEach((key) => {
    const propsName = attrs[key].replace('$props.', '')
    root.attr(`:${key}`, propsName)
  })
}

export const generateEmptyVueComponentJS = (
  componentName: string,
  mappings: any,
  t = types
) => {
  const astFile = t.file(t.program([]), null, [])
  const vueJSExport = buildEmptyVueJSExport(t, { name: componentName })
  mappings.export = vueJSExport
  mappings.props = (vueJSExport.declaration as types.ObjectExpression).properties[1]
  astFile.program.body.push(vueJSExport)

  return astFile
}
