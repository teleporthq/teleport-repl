import { ComponentGenerator } from '@teleporthq/teleport-types'
import {
  createReactComponentGenerator,
  ReactStyleVariation,
} from '@teleporthq/teleport-component-generator-react'
import {
  createPreactComponentGenerator,
  PreactStyleVariation,
} from '@teleporthq/teleport-component-generator-preact'
import {
  createReactNativeComponentGenerator,
  ReactNativeStyleVariation,
} from '@teleporthq/teleport-component-generator-reactnative'

export enum ComponentType {
  REACT = 'React',
  VUE = 'Vue',
  PREACT = 'Preact',
  STENCIL = 'Stencil',
  ANGULAR = 'Angular',
  REACTNATIVE = 'ReactNative',
}

export const createAllReactStyleFlavors = () => {
  return Object.values(ReactStyleVariation).reduce(
    (acc: Record<string, ComponentGenerator>, styleKey) => {
      acc[styleKey] = createReactComponentGenerator(styleKey as ReactStyleVariation)
      return acc
    },
    {}
  )
}

export const createAllPreactStyleFlavors = () => {
  return Object.values(PreactStyleVariation).reduce(
    (acc: Record<string, ComponentGenerator>, styleKey) => {
      acc[styleKey] = createPreactComponentGenerator(styleKey as PreactStyleVariation)
      return acc
    },
    {}
  )
}

export const createAllReactNativeStyleFlavors = () => {
  return Object.values(ReactNativeStyleVariation).reduce(
    (acc: Record<string, ComponentGenerator>, styleKey) => {
      acc[styleKey] = createReactNativeComponentGenerator(
        styleKey as ReactNativeStyleVariation
      )
      return acc
    },
    {}
  )
}

export const DefaultStyleFlavors = {
  [ComponentType.REACT]: ReactStyleVariation.CSSModules,
  [ComponentType.PREACT]: PreactStyleVariation.CSSModules,
  [ComponentType.REACTNATIVE]: ReactNativeStyleVariation.StyledComponents,
  [ComponentType.VUE]: null,
  [ComponentType.STENCIL]: null,
  [ComponentType.ANGULAR]: null,
}

export const capitalize = (str: string) => {
  const flavor = str.toLowerCase()
  return flavor.charAt(0).toUpperCase() + flavor.slice(1)
}

export const dashToSpace = (str: string) => {
  return str.replace(/-/g, ' ')
}
