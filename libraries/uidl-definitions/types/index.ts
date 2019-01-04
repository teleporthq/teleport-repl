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
  propDefinitions?: Record<string, PropDefinition>
  stateDefinitions?: Record<string, StateDefinition>
}

export interface PropDefinition {
  type: string
  defaultValue?: string | number | boolean
}

export interface StateDefinition {
  type: string
  defaultValue: string | number | boolean
  values?: Array<{
    value: string | number | boolean
    meta?: {
      componentName?: string
      path?: string
      fileName?: string
    }
    transitions?: any
  }>
  actions?: string[]
}

export interface ComponentContent {
  type: string
  key: string
  states?: Array<{
    value: string | number | boolean | ConditionalExpression
    content: ComponentContent | string
  }>
  repeat?: {
    content: ComponentContent
    dataSource: string | any[]
  }
  dependency?: ComponentDependency
  style?: Record<string, any>
  attrs?: Record<string, any>
  events?: EventDefinitions
  children?: Array<ComponentContent | string>
}

export interface EventHandlerStatement {
  type: string
  modifies?: string
  newState?: string | number | boolean
  calls?: string
  args?: Array<string | number | boolean>
}

export interface EventDefinitions {
  [k: string]: EventHandlerStatement[]
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

export interface ConditionalExpression {
  conditions: Array<{
    operation: string
    operand?: string | boolean | number
  }>
  matchingCriteria: string
}

/* element mapping interfaces */

export interface ElementMapping {
  type: string
  dependency?: ComponentDependency
  attrs?: Record<string, any>
  children?: ComponentContent[]
  repeat?: {
    content: ComponentContent
    dataSource: string
  }
}

export type ElementsMapping = Record<string, ElementMapping>
