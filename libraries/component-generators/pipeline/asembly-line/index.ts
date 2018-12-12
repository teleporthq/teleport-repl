import {
  ComponentPlugin,
  ComponentStructure,
  Resolver,
  PipelineOperations,
  RegisterDependency,
} from '../types'

import {
  ComponentUIDL,
  ProjectUIDL,
  ComponentDependency,
  ElementsMapping,
} from '../../../uidl-definitions/types'

export interface RuntimeParams {
  localDependenciesPrefix?: string
  customMapping?: ElementsMapping
  initialStructure?: ComponentStructure
}
export default class ComponentAsemblyLine {
  private plugins: ComponentPlugin[]
  private elementsMapping: ElementsMapping
  private dependencies: Record<string, ComponentDependency>

  private localDependenciesPrefix: string = ''

  constructor(pipeline: ComponentPlugin[], elementsMapping: Record<string, any> = {}) {
    this.plugins = pipeline
    this.dependencies = {}
    this.elementsMapping = elementsMapping
  }

  public async run(uidl: ComponentUIDL | ProjectUIDL, params?: RuntimeParams) {
    const {
      initialStructure = {
        uidl,
        meta: null,
        chunks: [],
      },
      customMapping = {},
      localDependenciesPrefix = './',
    } = params || {}

    const structure = initialStructure

    // reset dependencies
    this.dependencies = {}
    this.localDependenciesPrefix = localDependenciesPrefix

    const pipelineOperations: PipelineOperations = {
      registerDependency: this.registerDependency,
      resolver: this.resolver,
      getDependencies: () => this.dependencies,
    }

    this.elementsMapping = { ...this.elementsMapping, ...customMapping }

    const finalStructure: ComponentStructure = await this.plugins.reduce(
      async (previousPluginOperation: Promise<any>, plugin) => {
        const modifiedStructure = await previousPluginOperation
        return plugin(modifiedStructure, pipelineOperations)
      },
      Promise.resolve(structure)
    )

    return {
      chunks: finalStructure.chunks,
      dependencies: this.dependencies,
    }
  }

  // This function returns the mapped element (the tag literal) together with its attributes and dependenices.
  // All the parameters come from the UIDL.
  // The attributes and dependencies specified at the UIDL level have priority over the mapping in the assembly line.
  private resolver: Resolver = (
    uidlType: string,
    uidlAttrs,
    uidlDependency?: ComponentDependency
  ) => {
    let mappedElement = this.elementsMapping[uidlType]
    const localDependenciesPrefix = this.localDependenciesPrefix || './'

    // In case the element is not found, we maintain the type as the tag name.
    const identityMapping = {
      name: uidlType,
    }

    mappedElement = mappedElement || identityMapping

    // We gather the results here uniting the mapped attributes and the uidl attributes.
    const resolvedAttrs: { [key: string]: any } = {}

    // This will gather all the attributes from the UIDL which are mapped using the elements-mapping
    // These attributes will not be added on the tag as they are, but using the elements-mapping
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
    if (nodeDependency && nodeDependency.type === 'local') {
      // When a dependency is specified without a path, we infer it is a local import.
      // This might be removed at a later point
      nodeDependency.path =
        nodeDependency.path || localDependenciesPrefix + mappedElement.name
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
