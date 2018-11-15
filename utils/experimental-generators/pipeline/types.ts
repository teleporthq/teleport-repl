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
 * The structure of a component contains multiple chunks, and information
 * about how these chunks work togather
 */
export interface ComponentStructure {
  chunks: ChunkDefinition[]
  meta: any
  uidl: any
}

/**
 * A consumer (plugin basically) is
 */
export type ComponentPlugin = (structure: ComponentStructure) => Promise<ComponentStructure>
