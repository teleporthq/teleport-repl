import { ComponentAssemblyLine, Builder } from '../pipeline'

import { createPlugin as reactComponent } from '../plugins/react/react-base-component'
import { createPlugin as reactStyledJSX } from '../plugins/react/react-styled-jsx'
import { createPlugin as reactJSS } from '../plugins/react/react-jss'
import { createPlugin as reactInlineStyles } from '../plugins/react/react-inline-styles'
import { createPlugin as reactPropTypes } from '../plugins/react/react-proptypes'
import { createPlugin as reactCSSModules } from '../plugins/react/react-css-modules'

import { createPlugin as importStatements } from '../plugins/common/import-statements'

import { ComponentPlugin, GeneratorOptions } from '../pipeline/types'
import { ComponentUIDL, ElementsMapping } from '../../uidl-definitions/types'

import htmlMapping from '../../uidl-definitions/elements-mapping/html-mapping.json'
import reactMapping from './elements-mapping.json'
import { groupChunksByFileId } from './utils'

export enum ReactComponentFlavors {
  InlineStyles,
  StyledJSX,
  JSS,
  CSSModules,
}

interface FactoryParams {
  variation: ReactComponentFlavors
  customMapping?: ElementsMapping
}

const createReactGenerator = (params: FactoryParams) => {
  const { variation, customMapping = {} } = params

  const configuredReactBaseComponent = reactComponent({
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
    importLibsChunkName: 'import',
  })

  const configuredReactCSSModules = reactCSSModules({
    componentChunkName: 'react-component',
  })

  const Options: Record<string, ComponentPlugin[]> = {
    [ReactComponentFlavors.InlineStyles]: [
      configuredReactBaseComponent,
      configuredReactInlineStyles,
      configuredPropTypes,
      configureImportStatements,
    ],
    [ReactComponentFlavors.StyledJSX]: [
      configuredReactBaseComponent,
      configuredReactStyledJSX,
      configuredPropTypes,
      configureImportStatements,
    ],
    [ReactComponentFlavors.JSS]: [
      configuredReactBaseComponent,
      configuredReactJSS,
      configuredPropTypes,
      configureImportStatements,
    ],
    [ReactComponentFlavors.CSSModules]: [
      configuredReactBaseComponent,
      configuredPropTypes,
      configuredReactCSSModules,
      configureImportStatements,
    ],
  }

  const generateComponentChunks = async (
    jsDoc: ComponentUIDL,
    generatorOptions?: GeneratorOptions
  ) => {
    const assemblyLine = new ComponentAssemblyLine(Options[variation], {
      ...htmlMapping,
      ...reactMapping,
      ...customMapping,
    })
    const chunksLinker = new Builder()

    const result = await assemblyLine.run(jsDoc, generatorOptions)

    const chunksByFileId = groupChunksByFileId(result.chunks)

    const code = chunksLinker.link(chunksByFileId.default)
    const css = chunksLinker.link(chunksByFileId['component-styles'])

    return {
      ...result,
      code,
      css,
    }
  }

  return generateComponentChunks
}

export default createReactGenerator
