export interface ProjectUIDL {
  $schema?: string
  name: string
  root: {
    name: string
    states: {
      [k: string]: {
        component: ComponentUIDL
        default?: boolean
        meta?: {
          url?: string
        }
      }
    }
  }
  components?: Record<string, ComponentUIDL>
}

export interface ComponentUIDL {
  $schema?: string
  name: string
  content: ComponentContent
  meta?: Record<string, any>
  propDefinitions?: PropDefinitions
}

export interface PropDefinitions {
  [k: string]: {
    type: string
    defaultValue?: string | number | boolean
  }
}

export interface ComponentContent {
  type: string
  dependency?: ComponentDependency
  name: string
  style?: Record<string, any>
  attrs?: Record<string, any>
  children?: Array<ComponentContent | string> | string
}

export interface ComponentDependency {
  type: string
  path?: string
  version?: string
  meta?: {
    namedImport?: boolean
    originalName?: string
  }
}

/* element mapping interfaces */

export interface ElementMapping {
  name: string
  dependency?: ComponentDependency
  attrs?: Record<string, any>
}

export type ElementsMapping = Record<string, ElementMapping>
