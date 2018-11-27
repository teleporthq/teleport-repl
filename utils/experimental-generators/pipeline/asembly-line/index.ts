import {
  ComponentPlugin,
  ComponentStructure,
  Resolver,
  ComponentDependency,
  PipelineOperations,
} from '../types'

export default class ComponentAsemblyLine {
  private plugins: ComponentPlugin[]
  private resolver: Resolver
  private dependencies: {
    [key: string]: ComponentDependency
  }

  constructor(pipeline: ComponentPlugin[], resolver: Resolver) {
    this.plugins = pipeline
    this.resolver = resolver
    this.dependencies = {}
  }

  public async run(uidl: any) {
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

    const len = this.plugins.length
    for (let i = 0; i < len; i++) {
      structure = await this.plugins[i](structure, pipelineOperations)
    }

    return {
      chunks: structure.chunks,
      dependencies: this.dependencies,
    }
  }

  private registerDependency(name: string, dependency: ComponentDependency) {
    this.dependencies[name] = dependency
  }
}
