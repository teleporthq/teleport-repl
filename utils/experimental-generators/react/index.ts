import htmlMapping from '../element-mappings/html'

import ComponentAsemblyLine from '../pipeline/asembly-line'
import Builder from '../pipeline/builder'

import { createPlugin as reactComponent } from '../pipeline/plugins/react/react-base-component'
import { createPlugin as reactStyledJSX } from '../pipeline/plugins/react/react-styled-jsx'
import { createPlugin as reactJSS } from '../pipeline/plugins/react/react-jss'
import { createPlugin as reactInlineStyles } from '../pipeline/plugins/react/react-inline-styles'
import { createPlugin as reactPropTypes } from '../pipeline/plugins/react/react-proptypes'

const configuredReactJSX = reactComponent({
  componentChunkName: 'react-component',
  exportChunkName: 'export',
})

const configuredReactStyledJSX = reactStyledJSX({
  componentChunkName: 'react-component',
})

const configuredReactJSS = reactJSS({
  componentChunkName: 'react-component',
  exportChunkName: 'export',
})

const configuredReactInlineStyles = reactInlineStyles({
  componentChunkName: 'react-component',
})

const configuredPropTypes = reactPropTypes({
  componentChunkName: 'react-component',
})

const mapperConfiguration = (type: string) => {
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
          namedImport: false,
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

const Options: { [key: string]: any } = {
  InlineStyles: [configuredReactJSX, configuredReactInlineStyles, configuredPropTypes],
  StyledJSX: [configuredReactJSX, configuredReactStyledJSX, configuredPropTypes],
  JSS: [configuredReactJSX, configuredReactJSS, configuredPropTypes],
}

const generateComponent = async (jsDoc: any, variation: string = 'InlineStyles') => {
  const asemblyLine = new ComponentAsemblyLine(Options[variation], mapperConfiguration)

  const chunksLinker = new Builder()

  const result = await asemblyLine.run(jsDoc)
  return chunksLinker.link(result)
}

export { generateComponent }
