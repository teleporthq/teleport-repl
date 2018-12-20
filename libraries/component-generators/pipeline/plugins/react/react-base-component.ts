import * as t from '@babel/types'

import {
  addChildJSXTag,
  addChildJSXText,
  addASTAttributeToJSXTag,
  generateASTDefinitionForJSXTag,
  addDynamicChild,
  addDynamicPropOnJsxOpeningTag,
  createConditionalJSXExpression,
} from '../../utils/jsx-ast'

import { makeDefaultExport } from '../../utils/js-ast'
import { addEventsToTag, makePureComponent } from './utils'

import { capitalize } from '../../utils/helpers'

import {
  ComponentPlugin,
  Resolver,
  ComponentPluginFactory,
  RegisterDependency,
} from '../../types'
import { StateIdentifier } from './types'

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
      addDynamicPropOnJsxOpeningTag(tag, key, dynamicPropValue, 'props')
    } else if (attrs[key].startsWith('$state.')) {
      const dynamicPropValue = attrs[key].replace('$state.', '')
      addDynamicPropOnJsxOpeningTag(tag, key, dynamicPropValue)
    } else {
      addASTAttributeToJSXTag(tag, { name: key, value: attrs[key] })
    }
  })
}

const addTextElementToTag = (tag: t.JSXElement, text: string) => {
  if (text.startsWith('$props.') && !text.endsWith('$props.')) {
    addDynamicChild(tag, text.replace('$props.', ''), 'props')
  } else if (text.startsWith('$state.') && !text.endsWith('$state.')) {
    addDynamicChild(tag, text.replace('$state.', ''))
  } else {
    addChildJSXText(tag, text)
  }
}

export const generateTreeStructure = (
  content: ComponentContent,
  stateIdentifiers: Record<string, StateIdentifier>,
  nodesLookup: Record<string, t.JSXElement>,
  resolver: Resolver,
  registerDependency: RegisterDependency
): t.JSXElement => {
  const { type, children, key, attrs, dependency, events } = content

  const mappedElement = resolver(type, attrs, dependency)
  const mappedNodeName = mappedElement.nodeName
  const mainTag = generateASTDefinitionForJSXTag(mappedNodeName)

  if (mappedNodeName === undefined) {
    // tslint:disable-next-line:no-console
    console.error('mappedType erorr for uidl content', content)
    throw new Error(`mappedType not found for ${type}`)
  }

  if (mappedElement.attrs) {
    addAttributesToTag(mainTag, mappedElement.attrs)
  }

  if (mappedElement.dependency) {
    // Make a copy to avoid reference leaking
    registerDependency(mappedNodeName, { ...mappedElement.dependency })
  }

  if (events) {
    addEventsToTag(mainTag, events, stateIdentifiers)
  }

  if (children) {
    children.forEach((child) => {
      if (!child) {
        return
      }

      if (typeof child === 'string') {
        addTextElementToTag(mainTag, child)
        return
      }

      if (child.type === 'state') {
        const { states = [], key: stateKey } = child
        states.forEach((stateBranch) => {
          const stateContent = stateBranch.content
          const stateIdentifier = stateIdentifiers[stateKey]
          if (!stateIdentifier) {
            return
          }

          if (typeof stateContent === 'string') {
            const jsxExpression = createConditionalJSXExpression(
              stateContent,
              stateBranch,
              stateIdentifier
            )
            mainTag.children.push(jsxExpression)
          } else {
            const stateChildSubTree = generateTreeStructure(
              stateContent,
              stateIdentifiers,
              nodesLookup,
              resolver,
              registerDependency
            )

            const jsxExpression = createConditionalJSXExpression(
              stateChildSubTree,
              stateBranch,
              stateIdentifier
            )
            mainTag.children.push(jsxExpression)
          }
        })

        return
      }

      const childTag = generateTreeStructure(
        child,
        stateIdentifiers,
        nodesLookup,
        resolver,
        registerDependency
      )

      addChildJSXTag(mainTag, childTag)
    })
  }

  // UIDL name should be unique
  nodesLookup[key] = mainTag

  return mainTag
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
    })

    let stateIdentifiers: Record<string, StateIdentifier> = {}
    if (uidl.stateDefinitions) {
      registerDependency('useState', {
        type: 'library',
        path: 'react',
        meta: {
          namedImport: true,
        },
      })

      const stateDefinitions = uidl.stateDefinitions
      stateIdentifiers = Object.keys(stateDefinitions).reduce(
        (acc: Record<string, StateIdentifier>, stateKey: string) => {
          acc[stateKey] = {
            key: stateKey,
            type: stateDefinitions[stateKey].type,
            default: stateDefinitions[stateKey].defaultValue,
            setter: 'set' + capitalize(stateKey),
          }

          return acc
        },
        {}
      )
    }

    // We will keep a flat mapping object from each component identifier (from the UIDL) to its correspoding JSX AST Tag
    // This will help us inject style or classes at a later stage in the pipeline, upon traversing the UIDL
    // The structure will be populated as the AST is being created
    const nodesLookup = {}
    const jsxTagStructure = generateTreeStructure(
      uidl.content,
      stateIdentifiers,
      nodesLookup,
      resolver,
      registerDependency
    )

    const pureComponent = makePureComponent(uidl.name, stateIdentifiers, jsxTagStructure)

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
