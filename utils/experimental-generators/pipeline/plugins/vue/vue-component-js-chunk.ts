import * as t from '@babel/types'

import { ComponentPlugin } from '../../types'
import { buildEmptyVueJSExport } from '../../../vue/utils'

const makeEmptyAST = () => {
  return t.file(t.program([]), null, [])
}

const generateEmptyVueComponentJS = (jsDoc: any, uidlMappings: any) => {
  const componentName = jsDoc.name
  const astFile = makeEmptyAST()
  const vueJSExport = buildEmptyVueJSExport(t, { name: componentName })
  uidlMappings.export = vueJSExport
  uidlMappings.props = (vueJSExport.declaration as t.ObjectExpression).properties[1]
  astFile.program.body.push(vueJSExport)

  return astFile
}

const vueComponentJSChunkPlugin: ComponentPlugin = async (structure) => {
  const { uidl, chunks } = structure

  const uidlMappings = {}
  const content = generateEmptyVueComponentJS(uidl, uidlMappings)

  chunks.push({
    type: 'js',
    meta: {
      usage: 'vue-component-js',
      uidlMappings,
    },
    content,
  })

  return structure
}

export default vueComponentJSChunkPlugin
