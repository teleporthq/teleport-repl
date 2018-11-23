import { GeneratorFunction } from '../../types'

export const generator: GeneratorFunction = (htmlObject) => {
  return htmlObject.html() as string
}
