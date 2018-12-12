import * as t from '@babel/types'

import {
  addChildJSXTag,
  addChildJSXText,
  addASTAttributeToJSXTag,
  generateASTDefinitionForJSXTag,
  addDynamicChild,
  addDynamicPropOnJsxOpeningTag,
} from '../../utils/jsx-ast'

import { makeDefaultExport } from '../../utils/js-ast'

import {
  ComponentPlugin,
  Resolver,
  ComponentPluginFactory,
  RegisterDependency,
} from '../../types'

import { ComponentContent } from '../../../../uidl-definitions/types'

/**
 *
 * @param tag the ref to the AST tag under construction
 * @param attrs the attributes that should be added on the current AST node
 */
const addAttributesToTag = (tag: t.JSXElement, attrs: any) => {
  Object.keys(attrs).forEach((key) => {
    if (attrs[key].startsWith('$props.')) {
      const dynamicPropValue = attrs[key].replace('$props.', '')
      addDynamicPropOnJsxOpeningTag(tag, key, dynamicPropValue)
    } else {
      addASTAttributeToJSXTag(tag, { name: key, value: attrs[key] })
    }
  })
}

const addTextElementToTag = (tag: t.JSXElement, text: string) => {
  if (text.startsWith('$props.') && !text.endsWith('$props.')) {
    addDynamicChild(tag, text.replace('$props.', ''))
  } else {
    addChildJSXText(tag, text)
  }
}

export const generateTreeStructure = (
  content: ComponentContent,
  nodesLookup: Record<string, t.JSXElement>,
  resolver: Resolver,
  registerDependency: RegisterDependency
): t.JSXElement => {
  const { type, children, name, attrs, dependency } = content
  const mappedElement = resolver(type, attrs, dependency)
  const mappedNodeName = mappedElement.nodeName
  const mainTag = generateASTDefinitionForJSXTag(mappedNodeName)

  if (mappedNodeName === undefined) {
    // tslint:disable-next-line:no-console
    console.error('mappedType erorr for uidl content', content)
    throw new Error(`mappedType not found for ${type}`)
  }

  addAttributesToTag(mainTag, mappedElement.attrs)

  if (mappedElement.dependency) {
    // Make a copy to avoid reference leaking
    registerDependency(mappedNodeName, { ...mappedElement.dependency })
  }

  if (children) {
    if (Array.isArray(children)) {
      children.forEach((child) => {
        if (!child) {
          return
        }
        if (typeof child === 'string') {
          addTextElementToTag(mainTag, child)
          return
        }

        const childTag = generateTreeStructure(
          child,
          nodesLookup,
          resolver,
          registerDependency
        )
        if (!childTag) {
          return
        }
        addChildJSXTag(mainTag, childTag)
      })
    } else {
      const textElement = children.toString()
      addTextElementToTag(mainTag, textElement)
    }
  }

  // UIDL name should be unique
  nodesLookup[name] = mainTag

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

interface JSXConfig {
  componentChunkName: string
  exportChunkName: string
  importChunkName: string
}

export const createPlugin: ComponentPluginFactory<JSXConfig> = (config) => {
  const {
    componentChunkName = 'react-component',
    exportChunkName = 'export',
    importChunkName = 'import',
  } = config || {}

  const reactComponentPlugin: ComponentPlugin = async (structure, operations) => {
    const { uidl } = structure
    const { resolver, registerDependency } = operations

    registerDependency('React', {
      type: 'library',
      path: 'react',
      version: '16.6.3',
    })

    // We will keep a flat mapping object from each component identifier (from the UIDL) to its correspoding JSX AST Tag
    // This will help us inject style or classes at a later stage in the pipeline, upon traversing the UIDL
    // The structure will be populated as the AST is being created
    const nodesLookup = {}
    const jsxTagStructure = generateTreeStructure(
      uidl.content,
      nodesLookup,
      resolver,
      registerDependency
    )

    const pureComponent = makePureComponent({
      name: uidl.name,
      jsxTagTree: jsxTagStructure,
    })

    structure.chunks.push({
      type: 'js',
      name: componentChunkName,
      linker: {
        after: [importChunkName],
      },
      meta: {
        nodesLookup,
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
