import { ComponentPlugin, Resolver, ComponentPluginFactory } from '../../types'
import { generateSingleVueNode, splitProps, generateEmptyVueComponentJS } from './utils'
import { objectToObjectExpression } from '../../utils/jsx-ast'

const generateVueNodesTree = (
  content: {
    type: string
    children: any
    style: any
    name: string
    attrs: { [key: string]: any }
  },
  mappings: { [key: string]: any },
  resolver: Resolver,
  accumulatedProps: { [key: string]: any }
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
        const childTag = generateVueNodesTree(child, mappings, resolver, accumulatedProps)
        root.append(childTag.root())
      })
    } else if (typeof children === 'string') {
      if (children.startsWith('$props.')) {
        const propName = children.replace('$props.', '')
        accumulatedProps[propName] = String
        root.append(`{{${propName}}}`)
      } else {
        root.append(children.toString())
      }
    }
  }

  const { staticProps, dynamicProps } = splitProps(attrs || {})

  Object.keys(staticProps).forEach((key) => {
    root.attr(key, staticProps[key])
  })

  Object.keys(dynamicProps).forEach((key) => {
    const propName = dynamicProps[key].replace('$props.', '')
    root.attr(`:${key}`, propName)
    accumulatedProps[propName] = String
  })

  mappings.templateMapping[name] = root

  return mainTag
}

interface VueStyleChunkConfig {
  vueTemplateChunkName: string
  vueJSChunkName: string
}

export const createPlugin: ComponentPluginFactory<VueStyleChunkConfig> = (config) => {
  const {
    vueTemplateChunkName = 'vue-component-template-chunk',
    vueJSChunkName = 'vue-component-js-chunk',
  } = config || {}

  const vueBasicComponentChunks: ComponentPlugin = async (structure) => {
    const { uidl, chunks, resolver } = structure

    const mappings: {
      templateMapping: { [key: string]: any }
      jsMapping: { [key: string]: any }
    } = {
      templateMapping: {},
      jsMapping: {},
    }

    const accumulatedProps = {}
    const tempalteContent = generateVueNodesTree(
      uidl.content,
      mappings,
      resolver,
      accumulatedProps
    )

    chunks.push({
      type: 'html',
      name: vueTemplateChunkName,
      meta: {
        mappings: mappings.templateMapping,
      },
      wrap: (generatedContent) => {
        return `<template>\n\n${generatedContent}\n</template>\n`
      },
      content: tempalteContent,
    })

    const jsContent = generateEmptyVueComponentJS(uidl.name, mappings.jsMapping)

    mappings.jsMapping.props.value.properties.push(
      ...objectToObjectExpression(accumulatedProps).properties
    )

    chunks.push({
      type: 'js',
      name: vueJSChunkName,
      meta: {
        mappings: mappings.jsMapping,
      },
      wrap: (generatedContent) => {
        return `<script>\n\n${generatedContent}\n</script>`
      },
      content: jsContent,
    })

    return structure
  }

  return vueBasicComponentChunks
}

export default createPlugin()
