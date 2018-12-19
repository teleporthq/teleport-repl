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
import { StateHook } from './types'

import { ComponentContent, StateDefinitions } from '../../../../uidl-definitions/types'

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
  nodesLookup: Record<string, t.JSXElement>,
  resolver: Resolver,
  registerDependency: RegisterDependency,
  stateDefinitions: StateDefinitions,
  stateHooksIdentifiers: StateHook[]
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

  addAttributesToTag(mainTag, mappedElement.attrs)

  if (events) {
    addEventsToTag(mainTag, events, stateDefinitions, stateHooksIdentifiers)
  }

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

        if (child.type === 'state') {
          const { states = [], key: stateKey } = child
          states.forEach((stateBranch) => {
            const stateContent = stateBranch.content
            const valueType = stateDefinitions[stateKey].type
            if (typeof stateContent === 'string') {
              const jsxExpression = createConditionalJSXExpression(
                stateContent,
                stateKey,
                stateBranch.value,
                valueType
              )
              mainTag.children.push(jsxExpression)
            } else {
              const stateChildSubTree = generateTreeStructure(
                stateContent,
                nodesLookup,
                resolver,
                registerDependency,
                stateDefinitions,
                stateHooksIdentifiers
              )

              const jsxExpression = createConditionalJSXExpression(
                stateChildSubTree,
                stateKey,
                stateBranch.value,
                valueType
              )
              mainTag.children.push(jsxExpression)
            }
          })

          return
        }

        const childTag = generateTreeStructure(
          child,
          nodesLookup,
          resolver,
          registerDependency,
          stateDefinitions,
          stateHooksIdentifiers
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

    let stateHooksIdentifiers: StateHook[] = []
    if (uidl.stateDefinitions) {
      registerDependency('useState', {
        type: 'library',
        path: 'react',
        meta: {
          namedImport: true,
        },
      })

      const stateKeys = Object.keys(uidl.stateDefinitions)
      const definitions = uidl.stateDefinitions
      stateHooksIdentifiers = stateKeys.map((key) => ({
        key,
        type: definitions[key].type,
        default: definitions[key].defaultValue,
        setter: 'set' + capitalize(key),
      }))
    }

    // We will keep a flat mapping object from each component identifier (from the UIDL) to its correspoding JSX AST Tag
    // This will help us inject style or classes at a later stage in the pipeline, upon traversing the UIDL
    // The structure will be populated as the AST is being created
    const nodesLookup = {}
    const jsxTagStructure = generateTreeStructure(
      uidl.content,
      nodesLookup,
      resolver,
      registerDependency,
      uidl.stateDefinitions || {},
      stateHooksIdentifiers
    )

    const pureComponent = makePureComponent(
      uidl.name,
      stateHooksIdentifiers,
      jsxTagStructure
    )

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
