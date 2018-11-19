import { ComponentPlugin, ComponentStructure, Resolver } from './types'

export default class ComponentAsemblyLine {
  private plugins: ComponentPlugin[]
  private resolver: Resolver

  constructor(pipeline: ComponentPlugin[], resolver: Resolver) {
    this.plugins = pipeline
    this.resolver = resolver
  }

  public async run(uidl: any) {
    let structure: ComponentStructure = {
      uidl,
      meta: null,
      chunks: [],
      dependencies: [],
      resolver: this.resolver,
    }
    const len = this.plugins.length
    for (let i = 0; i < len; i++) {
      structure = await this.plugins[i](structure)
    }

    return structure
  }
}
