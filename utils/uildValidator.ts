import Ajv from 'ajv'
import schema from './schema' // This will be remote at one point

const ajv = new Ajv()

// Schema is defined in the schema.js file, according to the JSON Schema standard: https://json-schema.org/latest/json-schema-core.html
const validate = ajv.compile(schema)

export default function validateJSON(input: any) {
  const valid = validate(input)
  if (!valid) {
    return validate.errors
  }

  return true
}
