import { ComponentAssemblyLine, Builder } from '../pipeline'

import { createPlugin as reactComponent } from '../pipeline/plugins/react/react-base-component'
import { createPlugin as reactStyledJSX } from '../pipeline/plugins/react/react-styled-jsx'
import { createPlugin as reactJSS } from '../pipeline/plugins/react/react-jss'
import { createPlugin as reactInlineStyles } from '../pipeline/plugins/react/react-inline-styles'
import { createPlugin as reactPropTypes } from '../pipeline/plugins/react/react-proptypes'
import { createPlugin as importStatements } from '../pipeline/plugins/common/import-statements'

import { ComponentPlugin } from '../pipeline/types'

import standardMapping from '../elements-mapping.json'
import reactMapping from './elements-mapping.json'

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
    importLibsChunkName: 'import',
  })

  const Options: Record<string, ComponentPlugin[]> = {
    [ReactComponentFlavors.InlineStyles]: [
      configuredReactJSX,
      configuredReactInlineStyles,
      configuredPropTypes,
      configureImportStatements,
    ],
    [ReactComponentFlavors.StyledJSX]: [
      configuredReactJSX,
      configuredReactStyledJSX,
      configuredPropTypes,
      configureImportStatements,
    ],
    [ReactComponentFlavors.JSS]: [
      configuredReactJSX,
      configuredReactJSS,
      configuredPropTypes,
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
    const code = chunksLinker.link(result.chunks)
    return {
      ...result,
      code,
    }
  }

  return generateComponentChunks
}

export default createReactGenerator
