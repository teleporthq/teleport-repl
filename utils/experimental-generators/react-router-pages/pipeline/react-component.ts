import ComponentAsemblyLine from '../../pipeline/asembly-line'
import Builder from '../../pipeline/builder'

import { createPlugin as reactComponent } from '../../pipeline/plugins/react/react-base-component'
import { createPlugin as reactStyledJSX } from '../../pipeline/plugins/react/react-styled-jsx'
import { createPlugin as reactJSS } from '../../pipeline/plugins/react/react-jss'
import { createPlugin as reactInlineStyles } from '../../pipeline/plugins/react/react-inline-styles'
import { createPlugin as reactPropTypes } from '../../pipeline/plugins/react/react-proptypes'
import { createPlugin as importStatements } from '../../pipeline/plugins/common/import-statements'
import { ComponentPlugin } from '../../pipeline/types'

export enum ReactComponentFlavors {
  InlineStyles,
  StyledJSX,
  JSS,
}

interface FactoryParams {
  variation: ReactComponentFlavors
}

const configureAsemlyLine = (params: FactoryParams) => {
  const { variation } = params

  const configuredReactJSX = reactComponent({
    componentChunkName: 'react-component',
    importChunkName: 'import',
    exportChunkName: 'export',
  })

  const configuredReactStyledJSX = reactStyledJSX({
    componentChunkName: 'react-component',
  })

  const configuredReactJSS = reactJSS({
    componentChunkName: 'react-component',
    importChunkName: 'import',
    exportChunkName: 'export',
  })

  const configuredReactInlineStyles = reactInlineStyles({
    componentChunkName: 'react-component',
  })

  const configuredPropTypes = reactPropTypes({
    componentChunkName: 'react-component',
  })

  const configureImportStatements = importStatements({
    importChunkName: 'import',
  })

  const customMappings = {
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

  const configureLocalDependencies: ComponentPlugin = async (structure, operations) => {
    const dependencies = operations.getDependencies()
    Object.keys(dependencies).forEach((key) => {
      if (dependencies[key].type === 'local') {
        dependencies[key].meta.path = `./components/${key}`
      }
    })
    return structure
  }

  const Options: { [key: string]: any } = {
    [ReactComponentFlavors.InlineStyles]: [
      configuredReactJSX,
      configuredReactInlineStyles,
      configuredPropTypes,
      configureLocalDependencies,
      configureImportStatements,
    ],
    [ReactComponentFlavors.StyledJSX]: [
      configuredReactJSX,
      configuredReactStyledJSX,
      configuredPropTypes,
      configureLocalDependencies,
      configureImportStatements,
    ],
    [ReactComponentFlavors.JSS]: [
      configuredReactJSX,
      configuredReactJSS,
      configuredPropTypes,
      configureLocalDependencies,
      configureImportStatements,
    ],
  }

  const generateComponentChunks = async (jsDoc: any) => {
    const asemblyLine = new ComponentAsemblyLine(
      'react',
      Options[variation],
      customMappings
    )

    const chunksLinker = new Builder()
    const result = await asemblyLine.run(jsDoc)
    result.code = chunksLinker.link(result.chunks)
    return result
  }

  return generateComponentChunks
}

export { configureAsemlyLine }
