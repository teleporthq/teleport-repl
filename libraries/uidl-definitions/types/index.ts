export interface ProjectUIDL {
  $schema?: string
  name: string
  root: ComponentUIDL
  components?: Record<string, ComponentUIDL>
}

export interface ComponentUIDL {
  $schema?: string
  name: string
  content: ComponentContent
  meta?: Record<string, any>
  propDefinitions?: PropDefinitions
  stateDefinitions?: StateDefinitions
}

export interface PropDefinitions {
  [k: string]: {
    type: string
    defaultValue?: string | number | boolean
  }
}

export interface StateDefinitions {
  [k: string]: {
    type: string
    defaultValue: string | number | boolean
    values?: Array<{ value: string | number | boolean; meta?: any; transitions?: any }>
    actions?: string[]
  }
}

export interface ComponentContent {
  type: string
  key: string
  states?: Array<{
    value: string | number | boolean
    operation?: string
    content: ComponentContent | string
  }>
  dependency?: ComponentDependency
  style?: Record<string, any>
  attrs?: Record<string, any>
  events?: EventDefinitions
  children?: Array<ComponentContent | string> | string
}

export interface EventDefinitions {
  [k: string]: Array<{
    modifies: string
    newState?: string | number | boolean
    action?: string
  }>
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
