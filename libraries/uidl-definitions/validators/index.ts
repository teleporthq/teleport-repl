import Ajv from 'ajv'
import componentSchema from '../schemas/component.json'
import projectSchema from '../schemas/project.json'
import { ComponentUIDL, ProjectUIDL } from '../types/index.js'

const ajv = new Ajv()

const componentValidator = ajv.compile(componentSchema)
const projectValidator = ajv.compile(projectSchema)

export const validateComponent = (input: ComponentUIDL) => {
  const valid = componentValidator(input)
  if (!valid && componentValidator.errors) {
    return componentValidator.errors
  }

  return true
}

export const validateProjectUIDL = (input: ProjectUIDL) => {
  const valid = projectValidator(input)
  if (!valid && projectValidator.errors) {
    return projectValidator.errors
  }

  return true
}
