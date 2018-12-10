import { ComponentAssemblyLine, Builder } from '../pipeline'

import { createPlugin as reactComponent } from '../pipeline/plugins/react/react-base-component'
import { createPlugin as reactStyledJSX } from '../pipeline/plugins/react/react-styled-jsx'
import { createPlugin as reactJSS } from '../pipeline/plugins/react/react-jss'
import { createPlugin as reactInlineStyles } from '../pipeline/plugins/react/react-inline-styles'
import { createPlugin as reactPropTypes } from '../pipeline/plugins/react/react-proptypes'
import { createPlugin as importStatements } from '../pipeline/plugins/common/import-statements'

import standardMapping from '../elements-mapping.json'
import reactMapping from './elements-mapping.json'

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

const Options: { [key: string]: any } = {
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
}

const generateComponent = async (
  jsDoc: any,
  variation: string = 'InlineStyles',
  customMapping: any
) => {
  const asemblyLine = new ComponentAssemblyLine(Options[variation], {
    ...standardMapping,
    ...reactMapping,
    ...customMapping,
  })

  const chunksLinker = new Builder()
  const result = await asemblyLine.run(jsDoc)

  return {
    code: chunksLinker.link(result.chunks),
    dependencies: result.dependencies,
  }
}

export default generateComponent
