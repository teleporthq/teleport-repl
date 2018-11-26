import * as t from '@babel/types'

import { ComponentPlugin, ComponentPluginFactory } from '../../types'

// add dynamic props on tempalte tags and also gather all found props to be added
// on the exported js chunk
const addDynamicTemplateBinds = (
  root: Cheerio,
  attrs: { [key: string]: string },
  accumulatedProps: { [key: string]: string }
) => {
  Object.keys(attrs).forEach((key) => {
    const propsName = attrs[key].replace('$props.', '')
    root.attr(`:${key}`, propsName)
    accumulatedProps[propsName] = 'String'
  })
}

// TODO move into utils, this could be the generic way of splitting/getting only
// the dynamic props
const getDynamicOnlyProps = (props: { [key: string]: any }): { [key: string]: any } => {
  return Object.keys(props)
    .filter((propKey) => {
      return props[propKey].startsWith('$props')
    })
    .reduce((newMap: { [key: string]: any }, key) => {
      newMap[key] = props[key]
      return newMap
    }, {})
}

const enhanceStructureWithDynamicBinds = (
  content: {
    type: string
    children: any
    style: any
    attrs: { [key: string]: any }
    name: string
  },
  uidlMappings: { [key: string]: any },
  accumulatedProps: { [key: string]: any }
): void => {
  const { name, attrs, children } = content

  if (attrs && Object.keys(attrs).length) {
    const root = uidlMappings[name]
    const dynamicProps = getDynamicOnlyProps(attrs)
    if (!root) {
      return
    }

    addDynamicTemplateBinds(root, dynamicProps, accumulatedProps)
  }

  if (Array.isArray(children)) {
    children.forEach((child) =>
      enhanceStructureWithDynamicBinds(child, uidlMappings, accumulatedProps)
    )
  }
}

/**
 * Inserts into export deault { props : { [...] } } the {...} part which will contain
 * all the dynamic props that are bound in the templte chunk. They all default to string
 * for now
 *
 * @param theVueJSChunkContent the AST declaration for the vue exported component
 * @param mappings the mappings for the AST declaration for easier access of key parts of the tree
 * @param accumulatedProps the props accumulated so far, to be added on the export props
 */
const insertTypeDefsInVueJSExport = (
  mappings: { [key: string]: any },
  accumulatedProps: { [key: string]: string }
) => {
  const exportProps = mappings.props.value.properties
  Object.keys(accumulatedProps).forEach((key) => {
    exportProps.push(t.objectProperty(t.identifier(key), t.identifier('String')))
  })
}

interface VueDynamicPropsConfig {
  vueJSChunk: string
  vueTemplateChunk: string
}

export const createPlugin: ComponentPluginFactory<VueDynamicPropsConfig> = (config) => {
  const {
    vueJSChunk = 'vue-component-js-chunk',
    vueTemplateChunk = 'vue-component-template-chunk',
  } = config || {}

  const vueTemplateChunkPlugin: ComponentPlugin = async (structure) => {
    const { uidl, chunks } = structure

    const theVueTemplateChunk = chunks.filter(
      (chunk) => chunk.name === vueTemplateChunk
    )[0]

    const theVueJSChunk = chunks.filter((chunk) => chunk.name === vueJSChunk)[0]

    if (!theVueTemplateChunk || !theVueJSChunk) {
      return structure
    }

    const accumulatedProps = {}

    enhanceStructureWithDynamicBinds(
      uidl.content,
      theVueTemplateChunk.meta.uidlMappings,
      accumulatedProps
    )

    insertTypeDefsInVueJSExport(theVueJSChunk.meta.uidlMappings, accumulatedProps)

    return structure
  }
  return vueTemplateChunkPlugin
}

export default createPlugin()
