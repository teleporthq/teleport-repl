import cheerio from 'cheerio'
import { ComponentPlugin } from '../../types'

const generateSingleVueNode = (params: { tagName: string }): CheerioStatic => {
  return cheerio.load(`<${params.tagName}> </${params.tagName}>`, {
    xmlMode: true, // otherwise the .html returns a <html><body> thing
    decodeEntities: false, // otherwise we can't set objects like `{ 'text-danger': hasError }`
    // without having them escaped with &quote; and stuff
  })
}

const generateVueNodesTree = (
  content: {
    type: string
    children: any
    style: any
    name: string
  },
  uidlMappings: { [key: string]: any }
): CheerioStatic => {
  const { name, type, children } = content
  const mappedType = type === 'Text' ? 'span' : 'div'
  const mainTag = generateSingleVueNode({ tagName: mappedType })
  const root = mainTag(mappedType)

  if (children) {
    if (Array.isArray(children)) {
      children.forEach((child) => {
        const childTag = generateVueNodesTree(child, uidlMappings)
        root.append(childTag(child.type === 'Text' ? 'span' : 'div'))
      })
    } else if (typeof children === 'string') {
      root.text(children.toString())
    }
  }

  // root.addClass(name)
  // root.attr('name', type)
  uidlMappings[name] = root

  return mainTag
}

const vueTemplateChunkPlugin: ComponentPlugin = async (structure) => {
  const { uidl, chunks } = structure

  const uidlMappings = {}
  const content = generateVueNodesTree(uidl.content, uidlMappings)

  chunks.push({
    type: 'html',
    meta: {
      usage: 'vue-component-template',
      uidlMappings,
    },
    content,
  })

  return structure
}

export default vueTemplateChunkPlugin
