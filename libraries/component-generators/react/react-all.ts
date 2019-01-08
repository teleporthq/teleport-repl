import { ComponentAssemblyLine, Builder } from '../pipeline'

import { createPlugin as reactComponent } from '../plugins/react/react-base-component'
import { createPlugin as reactStyledJSX } from '../plugins/react/react-styled-jsx'
import { createPlugin as reactJSS } from '../plugins/react/react-jss'
import { createPlugin as reactInlineStyles } from '../plugins/react/react-inline-styles'
import { createPlugin as reactPropTypes } from '../plugins/react/react-proptypes'
import { createPlugin as importStatements } from '../plugins/common/import-statements'
import { createPlugin as reactCSSModules } from '../plugins/react/react-css-modules'

import htmlMapping from '../../uidl-definitions/elements-mapping/html-mapping.json'
import reactMapping from './elements-mapping.json'
import { ComponentPlugin } from '../pipeline/types'
import { groupChunksByFileId } from './utils'
import { ComponentUIDL, ElementsMapping } from '../../uidl-definitions/types'

const configuredReactJSX = reactComponent({
  componentChunkName: 'react-component',
  importChunkName: 'import-libs',
  exportChunkName: 'export',
})

const configuredReactStyledJSX = reactStyledJSX({
  componentChunkName: 'react-component',
})

const configuredReactJSS = reactJSS({
  componentChunkName: 'react-component',
  importChunkName: 'import-libs',
  exportChunkName: 'export',
})

const configuredReactInlineStyles = reactInlineStyles({
  componentChunkName: 'react-component',
})

const configuredPropTypes = reactPropTypes({
  componentChunkName: 'react-component',
})

const configureImportStatements = importStatements({
  importLibsChunkName: 'import-libs',
})

const configuredReactCSSModules = reactCSSModules({
  componentChunkName: 'react-component',
})

const Options: Record<string, ComponentPlugin[]> = {
  InlineStyles: [
    configuredReactJSX,
    configuredReactInlineStyles,
    configuredPropTypes,
    configureImportStatements,
  ],

  StyledJSX: [
    configuredReactJSX,
    configuredReactStyledJSX,
    configuredPropTypes,
    configureImportStatements,
  ],

  JSS: [
    configuredReactJSX,
    configuredReactJSS,
    configuredPropTypes,
    configureImportStatements,
  ],

  CSSModules: [
    configuredReactJSX,
    configuredPropTypes,
    configuredReactCSSModules,
    configureImportStatements,
  ],
}

const generateComponent = async (
  jsDoc: ComponentUIDL,
  variation: string = 'InlineStyles',
  customMapping: ElementsMapping = {}
) => {
  const asemblyLine = new ComponentAssemblyLine(Options[variation], {
    ...htmlMapping,
    ...reactMapping,
    ...customMapping,
  })

  const chunksLinker = new Builder()
  const result = await asemblyLine.run(jsDoc)

  const chunksByFileId = groupChunksByFileId(result.chunks)

  const code = chunksLinker.link(chunksByFileId.default)
  const css = chunksLinker.link(chunksByFileId['component-styles'])

  return {
    code,
    dependencies: result.dependencies,
  }
}

export default generateComponent
