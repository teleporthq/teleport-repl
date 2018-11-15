import * as t from '@babel/types'

import { ComponentPlugin } from '../../types'
import { buildEmptyVueJSExport } from '../../../vue/utils'

const makeEmptyAST = () => {
  return t.file(t.program([]), null, [])
}

const generateEmptyVueComponentJS = (jsDoc: any) => {
  const componentName = jsDoc.name
  const astFile = makeEmptyAST()
  const vueJSExport = buildEmptyVueJSExport(t, { name: componentName })

  astFile.program.body.push(vueJSExport)

  return astFile
}

const vueComponentJSChunkPlugin: ComponentPlugin = async (structure) => {
  const { uidl, chunks } = structure

  const content = generateEmptyVueComponentJS(uidl)

  chunks.push({
    type: 'js',
    meta: {
      usage: 'vue-component-js',
    },
    content,
  })

  return structure
}

export default vueComponentJSChunkPlugin
