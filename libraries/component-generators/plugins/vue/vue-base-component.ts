import { ComponentPlugin, ComponentPluginFactory, RegisterDependency } from '../../types'

import {
  splitProps,
  generateEmptyVueComponentJS,
  generateVueComponentPropTypes,
} from './utils'

import { createXMLNode } from '../../utils/xml'
import { objectToObjectExpression } from '../../utils/js-ast'
import { ComponentContent } from '../../../uidl-definitions/types'

const addTextNodeToTag = (tag: Cheerio, text: string) => {
  if (text.startsWith('$props.') && !text.endsWith('$props.')) {
    // For real time, when users are typing we need to make sure there's something after the dot (.)
    const propName = text.replace('$props.', '')
    if (propName === 'children') {
      const slot = createXMLNode('slot')
      tag.append(slot)
    } else {
      tag.append(`{{${propName}}}`)
    }
  } else {
    tag.append(text.toString())
  }
}

const generateVueNodesTree = (
  content: ComponentContent,
  templateLookup: Record<string, any>,
  registerDependency: RegisterDependency
): Cheerio => {
  const { type, children, attrs, dependency } = content

  if (dependency) {
    registerDependency(type, { ...dependency })
  }

  const root = createXMLNode(type)

  if (children) {
    children.forEach((child) => {
      if (typeof child === 'string') {
        addTextNodeToTag(root, child)
        return
      }
      const childTag = generateVueNodesTree(child, templateLookup, registerDependency)
      root.append(childTag)
    })
  }

  const { staticProps, dynamicProps } = splitProps(attrs || {})

  Object.keys(staticProps).forEach((key) => {
    root.attr(key, staticProps[key])
  })

  Object.keys(dynamicProps).forEach((key) => {
    const propName = dynamicProps[key].replace('$props.', '')
    root.attr(`:${key}`, propName)
  })

  templateLookup[name] = root

  return root
}

interface VueComponentConfig {
  vueTemplateChunkName: string
  vueJSChunkName: string
  htmlFileId: string
  jsFileAfter: string[]
  jsFileId: string
}

export const createPlugin: ComponentPluginFactory<VueComponentConfig> = (config) => {
  const {
    vueTemplateChunkName = 'vue-component-template-chunk',
    vueJSChunkName = 'vue-component-js-chunk',
    htmlFileId = null,
    jsFileId = null,
    jsFileAfter = [],
  } = config || {}

  const vueBasicComponentChunks: ComponentPlugin = async (structure, operations) => {
    const { uidl, chunks } = structure
    const { registerDependency, getDependencies } = operations

    // if file ids are not falsy, and different in value
    const separateFiles = (htmlFileId || jsFileId) && htmlFileId !== jsFileId

    const templateLookup: { [key: string]: any } = {}
    const scriptLookup: { [key: string]: any } = {}

    const templateContent = generateVueNodesTree(
      uidl.content,
      templateLookup,
      registerDependency
    )

    chunks.push({
      type: 'html',
      name: vueTemplateChunkName,
      meta: {
        lookup: templateLookup,
        fileId: htmlFileId,
      },
      wrap: separateFiles
        ? undefined
        : (generatedContent) => {
            return `<template>\n\n${generatedContent}\n</template>\n`
          },
      content: templateContent,
    })

    const accumulatedDependencies = getDependencies()
    const jsContent = generateEmptyVueComponentJS(
      uidl.name,
      {
        importStatements: [],
        componentDeclarations: Object.keys(accumulatedDependencies),
      },
      scriptLookup
    )

    // todo refactor into pure function
    if (uidl.propDefinitions) {
      scriptLookup.props.value.properties.push(
        ...objectToObjectExpression(generateVueComponentPropTypes(uidl.propDefinitions))
          .properties
      )
    }

    chunks.push({
      type: 'js',
      name: vueJSChunkName,
      linker: {
        after: jsFileAfter,
      },
      meta: {
        lookup: scriptLookup,
        fileId: jsFileId,
      },
      wrap: separateFiles
        ? undefined
        : (generatedContent) => {
            return `<script>\n\n${generatedContent}\n</script>`
          },
      content: jsContent,
    })

    return structure
  }

  return vueBasicComponentChunks
}

export default createPlugin()
