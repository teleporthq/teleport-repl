import {
  ComponentPlugin,
  ComponentStructure,
  Resolver,
  ComponentDependency,
  PipelineOperations,
} from '../types'

import htmlMappings from '../../element-mappings/html'
import reactMappings from '../../element-mappings/react'
import vueMappings from '../../element-mappings/vue'

const frameworkMappingsLookup = {
  react: reactMappings,
  vue: vueMappings,
}

export default class ComponentAsemblyLine {
  private plugins: ComponentPlugin[]
  private target: string
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

  public async run(uidl: any, customMappings: { [key: string]: any } = {}) {
    let structure: ComponentStructure = {
      uidl,
      meta: null,
      chunks: [],
    }

    const pipelineOperations: PipelineOperations = {
      registerDependency: this.registerDependency.bind(this),
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

  private resolver: Resolver = (elementType: string) => {
    const result = this.elementMappings[elementType]

    if (!result) {
      // If no mapping is found, use the type as the end value
      return {
        name: elementType,
      }
    }

    return result
  }

  private registerDependency(name: string, dependency: ComponentDependency) {
    this.dependencies[name] = dependency
  }
}
