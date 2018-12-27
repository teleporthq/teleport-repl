import { ComponentDependency, ElementsMapping } from '../../uidl-definitions/types'

export interface EmbedDefinition {
  chunkName: string
  slot: string
}

/**
 * React could have one or more JS chunks, nothing else.
 * Vue has a template chunk, of type XML/HTML, a javascript
 * chunk and a style chunk
 */
export interface ChunkDefinition {
  type: string
  name: string
  meta?: any | null
  wrap?: (content: string) => string
  content: any
  linker?: {
    slots?: {
      [key: string]: (chunks: ChunkDefinition[]) => any
    }
    after?: string[]
    embed?: EmbedDefinition
  }
}

/**
 * The structure of a component contains multiple chunks, and information
 * about how these chunks work togather
 */
export interface ComponentStructure {
  chunks: ChunkDefinition[]
  meta: any
  uidl: any
}

export interface PipelineOperations {
  registerDependency: RegisterDependency
  getDependencies: () => {
    [key: string]: ComponentDependency
  }
}

/**
 * The structure returned by the resolver function for each element of the UIDL
 */
export interface MappedElement {
  nodeName: string
  attrs?: any
  dependency?: ComponentDependency
}

/**
 * A consumer (plugin basically) is
 */
export type ComponentPlugin = (
  structure: ComponentStructure,
  operations: PipelineOperations
) => Promise<ComponentStructure>

/**
 * Configure a componnet plugin, specifing names or ids for chunks, to be later
 * used between other plugins and by the linker.
 */
interface ComponentDefaultPluginParams {
  fileId: string
}
export type ComponentPluginFactory<T> = (
  configuration?: Partial<T & ComponentDefaultPluginParams>
) => ComponentPlugin

export type RegisterDependency = (name: string, dependency: ComponentDependency) => void

export interface GeneratorOptions {
  localDependenciesPrefix?: string
  customMapping?: ElementsMapping
}

export type GeneratorFunction = (content: any) => string
