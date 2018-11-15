export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  title: 'Component Root',
  required: ['name', 'content', 'version'],
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      default: 'ComponentName',
    },
    content: {
      $ref: '#/definitions/content',
    },
    version: {
      type: 'string',
      default: 'v1',
    },
    meta: {
      type: 'object',
    },
  },
  definitions: {
    content: {
      type: 'object',
      required: ['type', 'source'],
      additionalProperties: false,
      properties: {
        type: {
          type: 'string',
          examples: ['Text', 'View'],
        },
        source: {
          type: 'string',
          examples: ['teleport-elements-core'],
        },
        name: {
          type: 'string',
          examples: ['Text', 'View'],
        },
        style: {
          $ref: '#/definitions/style',
        },
        attrs: {
          type: 'object',
        },
        children: {
          oneOf: [
            {
              type: 'array',
              items: {
                $ref: '#/definitions/content',
              },
              default: [],
            },
            {
              type: 'string',
            },
          ],
        },
      },
    },
    style: {
      type: 'object',
      properties: {
        width: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          examples: ['100%'],
        },
        height: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          examples: ['100%'],
        },
        flexDirection: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          examples: ['row'],
        },
        backgroundColor: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          examples: ['magenta'],
        },
      },
    },
  },
}
