import * as t from '@babel/types'

import {
  addChildJSXTag,
  addChildJSXText,
  addASTAttributeToJSXTag,
  generateASTDefinitionForJSXTag,
  addDynamicChild,
  addDynamicPropOnJsxOpeningTag,
} from '../../utils/jsx-ast'

import {
  makeDefaultExport,
  makeDefaultImportStatement,
  makeNamedMappedImportStatement,
  makeNamedImportStatement,
} from '../../utils/js-ast'

import {
  ComponentPlugin,
  MappedElement,
  Resolver,
  ComponentPluginFactory,
  ComponentStructure,
} from '../../types'

/**
 *
 * @param tag the ref to the AST tag under construction
 * @param mappedElement the structure returned by the resolver, needed for mapping the tag and the attributes
 * @param attrs the attributes defined on the UIDL for this node/tag
 */
const addAttributesToTag = (
  tag: t.JSXElement,
  mappedElement: MappedElement,
  attrs: any
) => {
  // This will gather all the attributes from the UIDL which are mapped using the element-mappings
  // These attributes will not be added on the tag as they are, but using the element-mappings
  // Such an example is the url attribute on the Link tag, which needs to be mapped in the case of html to href
  const mappedAttributes: [string?] = []

  // Standard attributes coming from the element mapping
  if (mappedElement.attrs) {
    Object.keys(mappedElement.attrs).forEach((key) => {
      const value = mappedElement.attrs[key]
      if (!value) {
        return
      }

      if (typeof value === 'string' && value.startsWith('$attrs.')) {
        // we lookup for the attributes in the UIDL and use the element-mapping key to set them on the tag
        // (ex: Link has an url attribute in the UIDL, but it needs to be mapped to href in the case of HTML)
        const uidlAttributeKey = value.replace('$attrs.', '')
        if (attrs && attrs[uidlAttributeKey]) {
          if (attrs[uidlAttributeKey].startsWith('$props.')) {
            const dynamicPropValue = attrs[uidlAttributeKey].replace('$props.', '')
            addDynamicPropOnJsxOpeningTag(tag, key, dynamicPropValue)
          } else {
            addASTAttributeToJSXTag(tag, { name: key, value: attrs[uidlAttributeKey] })
          }

          mappedAttributes.push(uidlAttributeKey)
        }

        // in the case of mapped reference attributes ($attrs) we don't write them unless they are specified in the uidl
        return
      }

      addASTAttributeToJSXTag(tag, { name: key, value })
    })
  }

  // Custom attributes coming from the UIDL
  if (attrs) {
    Object.keys(attrs).forEach((key) => {
      if (!mappedAttributes.includes(key)) {
        if (attrs[key].startsWith('$props.')) {
          const value = attrs[key].replace('$props.', '')
          addDynamicPropOnJsxOpeningTag(tag, key, value)
        } else {
          addASTAttributeToJSXTag(tag, { name: key, value: attrs[key] })
        }
      }
    })
  }
}

const generateTreeStructure = (
  content: any,
  uidlMappings: any = {},
  resolver: Resolver,
  dependencies: any = {}
): t.JSXElement => {
  const { type, children, name, attrs, dependency } = content
  const mappedElement = resolver(type)
  const mappedType = mappedElement.name
  const mainTag = generateASTDefinitionForJSXTag(mappedType)
  addAttributesToTag(mainTag, mappedElement, attrs)

  // If dependency is specified at UIDL level it will have priority over the mapping one
  const tagDependency = dependency || mappedElement.dependency
  if (tagDependency) {
    // Make a copy to avoid reference leaking
    dependencies[mappedType] = { ...tagDependency }
  }

  if (children) {
    if (Array.isArray(children)) {
      children.forEach((child) => {
        if (!child) {
          return
        }
        const childTag = generateTreeStructure(
          child,
          uidlMappings,
          resolver,
          dependencies
        )
        if (!childTag) {
          return
        }
        addChildJSXTag(mainTag, childTag)
      })
    } else {
      const stringPart = children.toString()
      if (stringPart.indexOf('$props.') === -1) {
        addChildJSXText(mainTag, children.toString())
      } else {
        addDynamicChild(mainTag, children.toString().replace('$props.', ''))
      }
    }
  }

  // UIDL name should be unique
  uidlMappings[name] = mainTag

  return mainTag
}

const resolveImportStatement = (componentName: string, dependency: any) => {
  const details =
    dependency.meta && dependency.meta.path
      ? dependency.meta
      : {
          // default meta, this will probably change later
          path: './' + componentName,
        }

  if (details.namedImport) {
    // if the component is listed under a different originalName, then import is "x as y"
    return details.originalName
      ? makeNamedMappedImportStatement(
          { [details.originalName]: componentName },
          details.path
        )
      : makeNamedImportStatement([componentName], details.path)
  }

  return makeDefaultImportStatement(componentName, details.path)
}

const generateImportChunk = (
  componentName: string,
  dependency: any,
  structure: ComponentStructure
) => {
  // If we want to resolve imports later, we can add the dependency as the content for each chunk
  const importContent = resolveImportStatement(componentName, dependency)
  structure.chunks.push({
    type: 'js',
    name: `import-${dependency.meta.path}`,
    content: importContent,
  })

  // Temporary, until we figure out how/when to output all depedencies
  if (dependency.type === 'package') {
    structure.dependencies.push(dependency)
  }
}

const makePureComponent = (params: { name: string; jsxTagTree: t.JSXElement }) => {
  const { name, jsxTagTree } = params
  const returnStatement = t.returnStatement(jsxTagTree)
  const arrowFunction = t.arrowFunctionExpression(
    [t.identifier('props')],
    t.blockStatement([returnStatement] || [])
  )

  const declarator = t.variableDeclarator(t.identifier(name), arrowFunction)
  const component = t.variableDeclaration('const', [declarator])

  return component
}

interface JSXConfig {
  componentChunkName: string
  exportChunkName: string
  importReactChunkName?: string
}

export const createPlugin: ComponentPluginFactory<JSXConfig> = (config) => {
  const {
    componentChunkName = 'react-component',
    exportChunkName = 'export',
    importReactChunkName = 'import-react',
  } = config || {}

  const reactComponentPlugin: ComponentPlugin = async (structure) => {
    const { uidl, resolver } = structure

    structure.chunks.push({
      type: 'js',
      name: importReactChunkName,
      content: makeDefaultImportStatement('React', 'react'),
    })

    // We will keep a flat mapping object from each component identifier (from the UIDL) to its correspoding JSX AST Tag
    // This will help us inject style or classes at a later stage in the pipeline, upon traversing the UIDL
    // The structure will be populated as the AST is being created
    const uidlMappings = {}
    const jsxDependencies: { [key: string]: any } = {}
    const jsxTagStructure = generateTreeStructure(
      uidl.content,
      uidlMappings,
      resolver,
      jsxDependencies
    )

    Object.keys(jsxDependencies).forEach((key) =>
      generateImportChunk(key, jsxDependencies[key], structure)
    )

    const pureComponent = makePureComponent({
      name: uidl.name,
      jsxTagTree: jsxTagStructure,
    })

    structure.chunks.push({
      type: 'js',
      name: componentChunkName,
      linker: {
        after: [importReactChunkName],
      },
      meta: {
        uidlMappings,
      },
      content: pureComponent,
    })

    structure.chunks.push({
      type: 'js',
      name: exportChunkName,
      linker: {
        after: [componentChunkName],
      },
      content: makeDefaultExport(uidl.name),
    })

    return structure
  }

  return reactComponentPlugin
}

export default createPlugin()
