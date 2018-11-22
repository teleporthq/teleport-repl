export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  title: 'Component Definition',
  required: ['name', 'content', 'version'],
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      default: 'MyComponent',
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
    propDefinitions: {
      type: 'object',
      patternProperties: {
        '.*': {
          type: 'object',
          additionalProperties: false,
          properties: {
            type: { type: 'string' },
            defaultValue: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'number',
                },
                {
                  type: 'boolean',
                },
              ],
            },
          },
        },
      },
    },
  },
  definitions: {
    content: {
      type: 'object',
      required: ['type', 'name'],
      additionalProperties: false,
      properties: {
        type: {
          type: 'string',
          examples: ['Text', 'View'],
        },
        dependency: {
          $ref: '#/definitions/dependency',
        },
        name: {
          type: 'string',
          default: 'MyComponent',
          examples: ['Component', 'View'],
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
    dependency: {
      type: 'object',
      additionalProperties: false,
      required: ['type'],
      properties: {
        type: { type: 'string', examples: ['package', 'local', 'library'] },
        meta: {
          type: 'object',
          additionalProperties: false,
          properties: {
            path: { type: 'string' },
            version: { type: 'string', default: '1.0.0' },
            namedImport: { type: 'boolean', default: false },
            originalName: { type: 'string' },
          },
        },
      },
    },
  },
}
