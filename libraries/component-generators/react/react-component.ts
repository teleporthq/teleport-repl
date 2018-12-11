import { ComponentAssemblyLine, Builder } from '../pipeline'

import { createPlugin as reactComponent } from '../pipeline/plugins/react/react-base-component'
import { createPlugin as reactStyledJSX } from '../pipeline/plugins/react/react-styled-jsx'
import { createPlugin as reactJSS } from '../pipeline/plugins/react/react-jss'
import { createPlugin as reactInlineStyles } from '../pipeline/plugins/react/react-inline-styles'
import { createPlugin as reactPropTypes } from '../pipeline/plugins/react/react-proptypes'
import { createPlugin as reactCSSModules } from '../pipeline/plugins/react/react-css-modules'

import { createPlugin as importStatements } from '../pipeline/plugins/common/import-statements'

import { ComponentPlugin } from '../pipeline/types'

import standardMapping from '../elements-mapping.json'
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
}

const createReactGenerator = (params: FactoryParams) => {
  const { variation } = params

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

  const asemblyLine = new ComponentAssemblyLine(Options[variation], {
    ...standardMapping,
    ...reactMapping,
  })
  const chunksLinker = new Builder()

  const generateComponentChunks = async (jsDoc: any, generatorOptions?: any) => {
    const result = await asemblyLine.run(jsDoc, generatorOptions)

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
