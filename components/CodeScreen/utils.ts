import {
  ComponentGenerator,
  GeneratedFile,
  StyleVariation,
} from '@teleporthq/teleport-types'
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
import { createAngularComponentGenerator } from '@teleporthq/teleport-component-generator-angular'
import { createStencilComponentGenerator } from '@teleporthq/teleport-component-generator-stencil'
import { createVueComponentGenerator } from '@teleporthq/teleport-component-generator-vue'
import complexComponentUIDL from '../../inputs/complex-component.json'
import contactForm from '../../inputs/contact-form.json'
import expandableArealUIDL from '../../inputs/expandable-area.json'
import navbar from '../../inputs/navbar.json'
import personSpotlight from '../../inputs/person-spotlight.json'
import simpleComponentUIDL from '../../inputs/simple-component.json'
import externalComponentUIDL from '../../inputs/external-components.json'
import tabSelector from '../../inputs/tab-selector.json'
import { ComponentType, GeneratorsCache } from './types'

const createAllReactStyleFlavors = () => {
  return Object.values(ReactStyleVariation).reduce(
    (acc: Record<string, ComponentGenerator>, styleKey) => {
      acc[styleKey] = createReactComponentGenerator({
        variation: styleKey as ReactStyleVariation,
      })
      return acc
    },
    {}
  )
}

const createAllPreactStyleFlavors = () => {
  return Object.values(PreactStyleVariation).reduce(
    (acc: Record<string, ComponentGenerator>, styleKey) => {
      acc[styleKey] = createPreactComponentGenerator({
        variation: styleKey as PreactStyleVariation,
      })
      return acc
    },
    {}
  )
}

const createAllReactNativeStyleFlavors = () => {
  return Object.values(ReactNativeStyleVariation).reduce(
    (acc: Record<string, ComponentGenerator>, styleKey) => {
      acc[styleKey] = createReactNativeComponentGenerator({
        variation: styleKey as ReactNativeStyleVariation,
      })
      return acc
    },
    {}
  )
}

export const concatenateAllFiles = (files: GeneratedFile[]) => {
  if (files.length === 1) {
    return files[0].content
  }

  return files.reduce((accCode, file) => {
    accCode += `// ${file.name}.${file.fileType}\n`
    accCode += file.content
    accCode += '\n'

    return accCode
  }, '')
}

export const FLAVORS_WITH_STYLES = [
  ComponentType.REACT,
  ComponentType.PREACT,
  ComponentType.REACTNATIVE,
]

export const DefaultStyleFlavors: Record<ComponentType, StyleVariation | null> = {
  [ComponentType.REACT]: ReactStyleVariation.CSSModules,
  [ComponentType.PREACT]: PreactStyleVariation.CSSModules,
  [ComponentType.REACTNATIVE]: ReactNativeStyleVariation.StyledComponents,
  [ComponentType.VUE]: null,
  [ComponentType.STENCIL]: null,
  [ComponentType.ANGULAR]: null,
}

export const generatorsCache: GeneratorsCache = {
  [ComponentType.ANGULAR]: createAngularComponentGenerator(),
  [ComponentType.VUE]: createVueComponentGenerator(),
  [ComponentType.STENCIL]: createStencilComponentGenerator(),
  [ComponentType.REACT]: createAllReactStyleFlavors(),
  [ComponentType.PREACT]: createAllPreactStyleFlavors(),
  [ComponentType.REACTNATIVE]: createAllReactNativeStyleFlavors(),
}

export const getStyleFlavorsForTarget = (target: ComponentType) => {
  switch (target) {
    case ComponentType.PREACT:
      return PreactStyleVariation
    case ComponentType.REACTNATIVE:
      return ReactNativeStyleVariation
    default:
      return ReactStyleVariation
  }
}

export const uidlSamples: Record<string, Record<string, unknown>> = {
  'simple-component': simpleComponentUIDL,
  'external-component': externalComponentUIDL,
  navbar,
  'contact-form': contactForm,
  'person-spotlight': personSpotlight,
  'complex-component': complexComponentUIDL,
  'expandable-area': expandableArealUIDL,
  'tab-selector': tabSelector,
}

export const dashToSpace = (str: string) => {
  return str.replace(/-/g, ' ')
}

export const spaceToDash = (str: string) => {
  return str.replace(/ /g, '-')
}
