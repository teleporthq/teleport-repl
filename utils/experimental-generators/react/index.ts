import htmlMapping from '../element-mappings/html'

import ComponentAsemblyLine from '../pipeline/asembly-line'
import Builder from '../pipeline/builder'

import { createPlugin as reactJSX } from '../pipeline/plugins/react/react-jsx'
import { createPlugin as reactPureComponent } from '../pipeline/plugins/react/react-pure-component'
import { createPlugin as styledJSX } from '../pipeline/plugins/react/react-styled-jsx-chunk'
import { createPlugin as dynamicProps } from '../pipeline/plugins/react/react-dynamic-props'
import { createPlugin as reactJSS } from '../pipeline/plugins/react/react-jss'
import { createPlugin as reactInlineStyles } from '../pipeline/plugins/react/react-inline-styles'

const configuredReactPureComponent = reactPureComponent({
  componentChunkName: 'main-component',
  exportChunkName: 'main-export',
})

const configuredReactJSX = reactJSX({
  chunkName: 'main-jsx',
  embed: {
    chunkName: 'main-component',
    slot: 'componet-jsx',
  },
})

const configuredReactStyledJSX = styledJSX({
  chunkName: 'component-styled-jsx',
  targetJsxChunk: 'main-jsx',
})

const configuredReactJSS = reactJSS({
  targetJSXChunk: 'main-jsx',
  styleChunkName: 'component-jss',
  exportChunkName: 'main-export',
})

const configuredDynamicProps = dynamicProps({
  targetJSXChunk: 'main-jsx',
})

const configuredReactInlineStyles = reactInlineStyles({
  targetJSXChunk: 'main-jsx',
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
  InlineStyles: [
    configuredReactPureComponent,
    configuredReactJSX,
    configuredReactInlineStyles,
    configuredDynamicProps,
  ],
  StyledJSX: [
    configuredReactPureComponent,
    configuredReactJSX,
    configuredReactStyledJSX,
    configuredDynamicProps,
  ],
  JSS: [
    configuredReactPureComponent,
    configuredReactJSX,
    configuredReactJSS,
    configuredDynamicProps,
  ],
}

const generateComponent = async (jsDoc: any, variation: string = 'InlineStyles') => {
  const asemblyLine = new ComponentAsemblyLine(Options[variation], mapperConfiguration)

  const chunksLinker = new Builder()

  const result = await asemblyLine.run(jsDoc)
  return chunksLinker.link(result)
}

export { generateComponent }
