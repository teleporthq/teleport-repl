import { ComponentPlugin, ComponentStructure } from './types'

export default class ComponentAsemblyLine {
  private plugins: ComponentPlugin[]

  constructor(pipeline: ComponentPlugin[]) {
    this.plugins = pipeline
  }

  public async run(uidl: any) {
    let structure: ComponentStructure = {
      uidl,
      meta: null,
      chunks: [],
    }
    const len = this.plugins.length
    for (let i = 0; i < len; i++) {
      structure = await this.plugins[i](structure)
    }

    return structure
  }
}
