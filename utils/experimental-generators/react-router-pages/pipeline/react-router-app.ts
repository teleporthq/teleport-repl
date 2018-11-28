import * as t from '@babel/types'

import {
  addChildJSXTag,
  addChildJSXText,
  addASTAttributeToJSXTag,
  generateASTDefinitionForJSXTag,
  addDynamicChild,
  addDynamicPropOnJsxOpeningTag,
} from '../../pipeline/utils/jsx-ast'

import { makeDefaultExport } from '../../pipeline/utils/js-ast'

import {
  ComponentPlugin,
  MappedElement,
  Resolver,
  ComponentPluginFactory,
  RegisterDependency,
} from '../../pipeline/types'

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
  registerDependency: RegisterDependency
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
    registerDependency(mappedType, { ...tagDependency })
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
          registerDependency
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

interface AppRoutingComponentConfig {
  componentChunkName: string
  exportChunkName: string
}

export const createPlugin: ComponentPluginFactory<AppRoutingComponentConfig> = (
  config
) => {
  // const {
  //   componentChunkName = 'app-routing-component',
  //   exportChunkName = 'app-routing-export',
  // } = config || {}

  const reactAppRoutingComponentPlugin: ComponentPlugin = async (
    structure,
    operations
  ) => {
    const { uidl } = structure
    const { resolver, registerDependency } = operations

    registerDependency('React', {
      type: 'library',
      meta: {
        path: 'react',
      },
    })

    registerDependency('React', {
      type: 'library',
      meta: {
        path: 'react-router-dom',
      },
    })

    const { states, content } = uidl
    const pages = states || {}

    if (content) {
      pages.default = 'index'
      pages.index = content
    }

    // console.log({ pages })

    // We will keep a flat mapping object from each component identifier (from the UIDL) to its correspoding JSX AST Tag
    // This will help us inject style or classes at a later stage in the pipeline, upon traversing the UIDL
    // // The structure will be populated as the AST is being created
    // const uidlMappings = {}
    // const jsxTagStructure = generateTreeStructure(
    //   uidl.content,
    //   uidlMappings,
    //   resolver,
    //   registerDependency
    // )

    // const pureComponent = makePureComponent({
    //   name: uidl.name,
    //   jsxTagTree: jsxTagStructure,
    // })

    // structure.chunks.push({
    //   type: 'js',
    //   name: componentChunkName,
    //   meta: {
    //     uidlMappings,
    //   },
    //   content: pureComponent,
    // })

    // structure.chunks.push({
    //   type: 'js',
    //   name: exportChunkName,
    //   linker: {
    //     after: [componentChunkName],
    //   },
    //   content: makeDefaultExport(uidl.name),
    // })

    return structure
  }

  return reactAppRoutingComponentPlugin
}

export default createPlugin()
