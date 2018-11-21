import ComponentAsemblyLine from '../pipeline/'
import htmlMapping from '../element-mappings/html'

import {
  reactJSXPlugin,
  reactInlineStyleComponentPlugin,
  reactStyledJSXChunkPlugin,
  reactJSSPlugin,
  reactPureComponentPlugin,
  reactBasicLinker,
  prettierPostPlugin,
  reactDynamicPropsPlugin,
} from '../pipeline/plugins/react'

const asemblyLine = new ComponentAsemblyLine(
  [
    reactJSXPlugin,
    reactDynamicPropsPlugin,
    reactStyledJSXChunkPlugin,
    // reactJSSPlugin,
    // reactInlineStyleComponentPlugin,
    reactPureComponentPlugin,
    reactBasicLinker,
    prettierPostPlugin,
  ],
  (type) => {
    const customMapping = {
      Datepicker: {
        name: 'ReactDatepicker',
        attrs: {
          'data-attr': 'test',
        },
        dependency: {
          type: 'package',
          meta: {
            path: 'react-datepicker',
            version: '1.0.2',
            namedImport: true,
            originalName: 'Datepicker',
          },
        },
      },
    }

    const mapping = {
      ...htmlMapping,
      ...customMapping,
    }
    // Here we could select based on target (ex: react, next)
    const result = (mapping as { [key: string]: any })[type]

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
