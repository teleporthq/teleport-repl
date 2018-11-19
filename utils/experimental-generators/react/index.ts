import ComponentAsemblyLine from '../pipeline/'
import htmlMapping from '../element-mappings/html'

import {
  reactJSXPlugin,
  reactInlineStyleComponentPlugin,
  reactPureComponentPlugin,
  reactBasicLinker,
  prettierPostPlugin,
  reactDynamicPropsPlugin,
  reactJSSPlugin,
} from '../pipeline/plugins/react'

const asemblyLine = new ComponentAsemblyLine(
  [
    reactJSXPlugin,
    reactDynamicPropsPlugin,
    reactJSSPlugin,
    // reactInlineStyleComponentPlugin,
    reactPureComponentPlugin,
    reactBasicLinker,
    prettierPostPlugin,
  ],
  (type) => {
    // Here we could select based on target (ex: react, next)
    const result = htmlMapping[type]

    if (!result) {
      // If no mapping is found, use the type as the end value
      return {
        name: type,
      }
    }

    return result
  }
)

const generateComponent = async (jsDoc: any) => {
  const result = await asemblyLine.run(jsDoc)
  return result.chunks[result.chunks.length - 1].content
}

export { generateComponent }
