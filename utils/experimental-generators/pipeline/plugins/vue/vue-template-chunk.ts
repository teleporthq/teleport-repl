import cheerio from 'cheerio'
import { ComponentPlugin, Resolver, ComponentPluginFactory } from '../../types'

const generateSingleVueNode = (params: {
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

// TODO move into utils, this could be the generic way of splitting/getting only
// the dynamic props
const getStaticOnlyProps = (props: { [key: string]: any }): { [key: string]: any } => {
  return Object.keys(props)
    .filter((propKey) => {
      return !props[propKey].startsWith('$props')
    })
    .reduce((newMap: { [key: string]: any }, key) => {
      newMap[key] = props[key]
      return newMap
    }, {})
}

const generateVueNodesTree = (
  content: {
    type: string
    children: any
    style: any
    name: string
    attrs: { [key: string]: any }
  },
  uidlMappings: { [key: string]: any },
  resolver: Resolver
): CheerioStatic => {
  const { name, type, children, attrs } = content
  const mappedType = resolver(type).name
  const mainTag = generateSingleVueNode({
    tagName: mappedType,
    selfClosing: !(children && children.length),
  })
  const root = mainTag(mappedType)

  if (children) {
    if (Array.isArray(children)) {
      children.forEach((child) => {
        const childTag = generateVueNodesTree(child, uidlMappings, resolver)
        root.append(childTag.root())
      })
    } else if (typeof children === 'string') {
      if (children.startsWith('$props.')) {
        root.append(`{{${children.replace('$props.', '')}}}`)
      } else {
        root.append(children.toString())
      }
    }
  }

  const staticAttrs = getStaticOnlyProps(attrs || {})

  Object.keys(staticAttrs).forEach((key) => {
    root.attr(key, staticAttrs[key])
  })

  uidlMappings[name] = root

  return mainTag
}

interface VueStyleChunkConfig {
  chunkName: string
  vueJSChunk: string
  vueTemplateChunk: string
}

export const createPlugin: ComponentPluginFactory<VueStyleChunkConfig> = (config) => {
  const { chunkName = 'vue-component-template-chunk' } = config || {}

  const vueTemplateChunkPlugin: ComponentPlugin = async (structure) => {
    const { uidl, chunks, resolver } = structure

    const uidlMappings = {}

    const content = generateVueNodesTree(uidl.content, uidlMappings, resolver)

    chunks.push({
      type: 'html',
      name: chunkName,
      meta: {
        usage: 'vue-component-template',
        uidlMappings,
      },
      wrap: (generatedContent) => {
        return `<template>\n\n${generatedContent}\n</template>\n`
      },
      content,
    })

    return structure
  }

  return vueTemplateChunkPlugin
}

export default createPlugin()
