import {
  ComponentPlugin,
  ComponentStructure,
  Resolver,
  ComponentDependency,
  PipelineOperations,
  RegisterDependency,
} from '../types'

import htmlMappings from '../../element-mappings/html'
import reactMappings from '../../element-mappings/react'
import vueMappings from '../../element-mappings/vue'

const frameworkMappingsLookup: { [key: string]: any } = {
  react: reactMappings,
  vue: vueMappings,
}

export interface RuntimeParams {
  customMappings?: { [key: string]: any }
  initialStructure?: ComponentStructure
}
export default class ComponentAsemblyLine {
  private plugins: ComponentPlugin[]
  private elementMappings: { [key: string]: any }
  private dependencies: {
    [key: string]: ComponentDependency
  }

  constructor(
    target: string,
    pipeline: ComponentPlugin[],
    customMappings: { [key: string]: any } = {}
  ) {
    this.plugins = pipeline
    this.dependencies = {}

    // This needs a generic solution
    const frameworkMappings = frameworkMappingsLookup[target]
    this.elementMappings = {
      ...htmlMappings,
      ...frameworkMappings,
      ...customMappings,
    }
  }

  public async run(uidl: any, params?: RuntimeParams) {
    const {
      initialStructure = {
        uidl,
        meta: null,
        chunks: [],
      },
      customMappings = {},
    } = params || {}

    let structure = initialStructure

    // reset dependencies
    this.dependencies = {}

    const pipelineOperations: PipelineOperations = {
      registerDependency: this.registerDependency,
      resolver: this.resolver,
      getDependencies: () => this.dependencies,
    }

    this.elementMappings = { ...this.elementMappings, ...customMappings }

    const len = this.plugins.length
    for (let i = 0; i < len; i++) {
      structure = await this.plugins[i](structure, pipelineOperations)
    }

    return {
      chunks: structure.chunks,
      dependencies: this.dependencies,
    }
  }

  // This function returns the mapped element (the tag literal) together with its attributes and dependenices.
  // All the parameters come from the UIDL.
  // The attributes and dependencies specified at the UIDL level have priority over the mappings in the assembly line.
  private resolver: Resolver = (uidlType: string, uidlAttrs, uidlDependency) => {
    let mappedElement = this.elementMappings[uidlType]

    // In case the element is not found, we maintain the type as the tag name.
    const identityMapping = {
      name: uidlType,
    }

    mappedElement = mappedElement || identityMapping

    // We gather the results here uniting the mapped attributes and the uidl attributes.
    const resolvedAttrs: { [key: string]: any } = {}

    // This will gather all the attributes from the UIDL which are mapped using the element-mappings
    // These attributes will not be added on the tag as they are, but using the element-mappings
    // Such an example is the url attribute on the Link tag, which needs to be mapped in the case of html to href
    const mappedAttributes: [string?] = []

    // First we iterate through the mapping attributes and we add them to the result
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
          if (uidlAttrs && uidlAttrs[uidlAttributeKey]) {
            resolvedAttrs[key] = uidlAttrs[uidlAttributeKey]
            mappedAttributes.push(uidlAttributeKey)
          }

          // in the case of mapped reference attributes ($attrs) we don't write them unless they are specified in the uidl
          return
        }

        resolvedAttrs[key] = mappedElement.attrs[key]
      })
    }

    // The UIDL attributes can override the mapped attributes, so they come last
    if (uidlAttrs) {
      Object.keys(uidlAttrs).forEach((key) => {
        // Skip the attributes that were mapped from $attrs
        if (!mappedAttributes.includes(key)) {
          resolvedAttrs[key] = uidlAttrs[key]
        }
      })
    }

    // If dependency is specified at UIDL level it will have priority over the mapping one
    const nodeDependency = uidlDependency || mappedElement.dependency
    if (nodeDependency) {
      // When a dependency is specified without a path, we infer it is a local import.
      // This might be removed at a later point
      nodeDependency.meta =
        nodeDependency.meta && nodeDependency.meta.path
          ? nodeDependency.meta
          : { ...nodeDependency.meta, path: './' + mappedElement.name }
    }

    return {
      nodeName: mappedElement.name,
      attrs: resolvedAttrs,
      dependency: nodeDependency,
    }
  }

  private registerDependency: RegisterDependency = (
    name,
    dependency: ComponentDependency
  ) => {
    this.dependencies[name] = dependency
  }
}
