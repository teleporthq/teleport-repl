import { ComponentGenerator, StyleVariation } from '@teleporthq/teleport-types'
import { concatenateAllFiles, DefaultStyleFlavors, generatorsCache } from './utils'
import customMapping from '../../inputs/repl-mapping.json'
import { ComponentType } from './types'

export const generateComponent = async (
  uidl: Record<string, unknown>,
  type: ComponentType,
  style?: StyleVariation
): Promise<{ code: string; dependencies: Record<string, string> }> => {
  const generator = generatorsCache[type]
  const options = {
    mapping: customMapping, // Temporary fix for svg's while the `line` element is converted to `hr` in the generators
    /* Project Style sheets are used only for project-generators. We need to show-case tokens in repl
      and so we are adding a empty project style sheet by default. */
    projectStyleSet: {
      styleSetDefinitions: {},
      fileName: 'style',
      path: '.',
    },
  }

  if (typeof generator?.generateComponent === 'function') {
    const { files, dependencies } = await generator.generateComponent(uidl, options)
    return { code: concatenateAllFiles(files), dependencies }
  } else {
    const variation = ((style || DefaultStyleFlavors) as unknown) as string
    if (!variation) {
      throw new Error(`Missing Style Variation`)
    }
    const { files, dependencies } = await (generator as Record<
      string,
      ComponentGenerator
    >)[variation].generateComponent(uidl, options)
    return { code: concatenateAllFiles(files), dependencies }
  }
}
