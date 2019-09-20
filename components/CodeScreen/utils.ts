import { ComponentGenerator } from '@teleporthq/teleport-types'
import {
  createReactComponentGenerator,
  ReactStyleVariation,
} from '@teleporthq/teleport-component-generator-react'
import {
  createPreactComponentGenerator,
  PreactStyleVariation,
} from '@teleporthq/teleport-component-generator-preact'

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
