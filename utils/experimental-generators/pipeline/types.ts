/**
 * React could have one or more JS chunks, nothing else.
 * Vue has a template chunk, of type XML/HTML, a javascript
 * chunk and a style chunk
 */
export interface ChunkDefinition {
  type: string
  meta: any | null
  content: any
}

/**
 * Each dependency has a type, a path used in the import statement
 * and a flag specifying if a named or a default import should be used
 */
export interface ComponentDependency {
  type: string
  path: string
  namedImport?: boolean
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
  dependency?: {
    type: string
    path: string
    namedImport?: boolean
  }
}

/**
 * A consumer (plugin basically) is
 */
export type ComponentPlugin = (
  structure: ComponentStructure
) => Promise<ComponentStructure>

/**
 * The function which resolves element mappings (primitive and custom)
 * @param type - uidl node which is converted
 */
export type Resolver = (type: string) => MappedElement
