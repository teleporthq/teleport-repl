import ComponentAsemblyLine from '../pipeline/'

import {
  reactJSXPlugin,
  reactInlineStyleComponentPlugin,
  reactPureComponentPlugin,
  reactBasicLinker,
  prettierPostPlugin,
  reactDynamicPropsPlugin,
} from '../pipeline/plugins/react'

const asemblyLine = new ComponentAsemblyLine([
  reactJSXPlugin,
  reactDynamicPropsPlugin,
  reactInlineStyleComponentPlugin,
  reactPureComponentPlugin,
  reactBasicLinker,
  prettierPostPlugin,
])

const generateComponent = async (jsDoc: any) => {
  const result = await asemblyLine.run(jsDoc)
  return result
}

export { generateComponent }
