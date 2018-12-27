import {
  ComponentPlugin,
  ComponentStructure,
  PipelineOperations,
  RegisterDependency,
} from '../types'

import { ComponentDependency, ElementsMapping } from '../../../uidl-definitions/types'
import { resolveUIDLNode } from './utils'

export interface RuntimeParams {
  localDependenciesPrefix?: string
  customMapping?: ElementsMapping
  initialStructure?: ComponentStructure
}
export default class ComponentAsemblyLine {
  private plugins: ComponentPlugin[]
  private elementsMapping: ElementsMapping
  private dependencies: Record<string, ComponentDependency>

  constructor(pipeline: ComponentPlugin[], elementsMapping: ElementsMapping = {}) {
    this.plugins = pipeline
    this.dependencies = {}
    this.elementsMapping = elementsMapping
  }

  public async run(uidl: any, params?: RuntimeParams) {
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

    const pipelineOperations: PipelineOperations = {
      registerDependency: this.registerDependency,
      getDependencies: () => this.dependencies,
    }

    this.elementsMapping = { ...this.elementsMapping, ...customMapping }

    structure.uidl = {
      ...structure.uidl,
      content: resolveUIDLNode(
        uidl.content,
        this.elementsMapping,
        localDependenciesPrefix
      ),
    }

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

  private registerDependency: RegisterDependency = (
    name,
    dependency: ComponentDependency
  ) => {
    this.dependencies[name] = dependency
  }
}
