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
 * Each dependency has a type, a path used in the import statement
 * and a flag specifying if a named or a default import should be used
 */
export interface ComponentDependency {
  type: string
  meta: {
    path?: string
    version?: string
    namedImport?: boolean
    originalName?: string
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
  dependencies: ComponentDependency[]
  resolver: Resolver
}

/**
 * The structure returned by the resolver function for each element of the UIDL
 */
export interface MappedElement {
  name: string
  attrs?: any
  dependency?: ComponentDependency
}

/**
 * A consumer (plugin basically) is
 */
export type ComponentPlugin = (
  structure: ComponentStructure
) => Promise<ComponentStructure>

/**
 * Configure a componnet plugin, specifing names or ids for chunks, to be later
 * used between other plugins and by the linker.
 */
export type ComponentPluginFactory<T> = (configuration?: T) => ComponentPlugin

/**
 * The function which resolves element mappings (primitive and custom)
 * @param type - uidl node which is converted
 */
export type Resolver = (type: string) => MappedElement

export type GeneratorFunction = (content: any) => string
