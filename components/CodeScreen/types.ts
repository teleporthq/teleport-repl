import { ComponentGenerator, StyleVariation } from '@teleporthq/teleport-types'

export interface CodeScreenProps {
  router: {
    query?: {
      uidlLink?: string
      flavor?: ComponentType
      style?: StyleVariation
    }
  }
}

export enum ComponentType {
  REACT = 'React',
  VUE = 'Vue',
  PREACT = 'Preact',
  STENCIL = 'Stencil',
  ANGULAR = 'Angular',
  REACTNATIVE = 'ReactNative',
}

export type GeneratorsCache = Record<
  ComponentType,
  ComponentGenerator | Record<string, ComponentGenerator>
>
