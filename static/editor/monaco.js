// Monaco editor core files path
require.config({ paths: { 'vs': '/static/node_modules/monaco-editor/min/vs' }})

// A global reference to the editor
let editor = null

// Each editor must have a specific name
// It will be used to post messages back to the parent window
let name = null

// listen to messages form parent window
window.addEventListener('message', onMessage, false)

function onMessage(event) {
  // if the meesage arrives before the editor is ready, retry a bit later
  if (!editor) {
    setTimeout(() => onMessage(event), 100)
    return
  }
  
  // console.log('income', event)
  
  const { type, value } = event.data
  switch (type) {
    case 'setName':
      name = value
      break;
    case 'setLanguage':
      monaco.editor.setModelLanguage(editor.getModel(), value)
      break;
    case 'setValue':
      editor.setValue(value)
      break;
    case 'setReadOnly':
      editor.updateOptions({ readOnly: value })
      break;
  
    default:
      throw new Error(`Message type \`type\` is not known.`)
      break;
  }
}

// init
require(['vs/editor/editor.main'], function() {
  monaco.editor.defineTheme('teleport', {
    base: 'vs-dark', // can also be vs-dark or hc-black
    inherit: true, // can also be false to completely replace the builtin rules
    rules: [
      { token: 'comment', foreground: 'a5a5a5', fontStyle: 'italic underline' },
      { token: 'comment.js', foreground: '57606C', fontStyle: 'bold'},
      { token: 'string.js', foreground: '82B977', fontStyle: 'bold' },
      { token: 'keyword.js', foreground: 'C36BC5', fontStyle: 'bold' },
      { token: 'identifier.js', foreground: 'AF4E5A', fontStyle: 'bold' },
      { token: 'comment.css', foreground: '0000ff' } // will inherit fontStyle from `comment` above
    ]
  });

  const modelUri = monaco.Uri.parse("http://teleport/uild.json"); // a made up unique URI for our model
  const model = monaco.editor.createModel("{}", "json", modelUri);

  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [{
      uri: 'http://teleport/uild.json',
      fileMatch: [modelUri.toString()],
      schema: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Component UIDL",
        "type": "object",
        "required": ["name", "content"],
        "additionalProperties": false,
        "properties": {
          "$schema": {
            "type": "string",
            "format": "uri"
          },
          "name": {
            "type": "string",
            "default": "MyComponent"
          },
          "content": {
            "$ref": "#/definitions/content"
          },
          "meta": {
            "type": "object"
          },
          "stateDefinitions": {
            "$ref": "#/definitions/stateDefinitions"
          },
          "propDefinitions": {
            "$ref": "#/definitions/propDefinitions"
          }
        },
        "definitions": {
          "content": {
            "type": "object",
            "required": [
              "type",
              "key"
            ],
            "additionalProperties": false,
            "properties": {
              "type": {
                "type": "string",
                "examples": [
                  "text",
                  "view",
                  "states"
                ]
              },
              "key": {
                "type": "string",
                "default": "node-key"
              },
              "states": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["value", "content"],
                  "additionalProperties": false,
                  "properties": {
                    "value": {
                      "oneOf": [
                        {
                          "type": "object",
                          "additionalProperties": false,
                          "required": ["matchingCriteria", "conditions"],
                          "properties": {
                            "conditions": {
                              "type": "array",
                              "items": {
                                "type": "object",
                                "required": ["operation"],
                                "additionalProperties": false,
                                "properties": {
                                  "operation": { "type": "string" },
                                  "operand": { }
                                }
                              }
                            },
                            "matchingCriteria": { "type": "string" }
                          }
                        },
                        { "type": "boolean" },
                        { "type": "number" },
                        { "type": "string" }
                      ]
                    },
                    "content": {
                      "oneOf": [
                        { "$ref": "#/definitions/content" },
                        { "type": "string" }
                      ]
                    }
                  }
                }
              },
              "repeat": {
                "type": "object",
                "additionalProperties": false,
                "required": ["content", "dataSource"],
                "properties": {
                  "content": { "$ref": "#/definitions/content" },
                  "dataSource": {
                    "oneOf": [
                      { "type": "string" },
                      { "type": "array" }
                    ]
                  },
                  "meta": { "type": "object" }
                }
              },
              "dependency": {
                "$ref": "#/definitions/dependency"
              },
              "events": {
                "type": "object",
                "patternProperties": {
                  ".*": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "required": ["type"],
                      "additionalProperties": false,
                      "properties": {
                        "type": { "type": "string", "enum": ["stateChange", "propCall"] },
                        "modifies": { "type": "string" },
                        "newState": { },
                        "calls": { "type": "string" },
                        "args": { "type": "array" }
                      }
                    }
                  }
                }
              },
              "style": {
                "$ref": "#/definitions/style"
              },
              "attrs": {
                "type": "object"
              },
              "children": {
                "type": "array",
                "items": {
                  "oneOf": [
                    { "$ref": "#/definitions/content" },
                    { "type": "string" }
                  ]
                },
                "default": []
              }
            }
          },
          "style": {
            "type": "object",
            "properties": {
              "width": {
                "oneOf": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "number"
                  }
                ],
                "examples": [
                  "100%"
                ]
              },
              "height": {
                "oneOf": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "number"
                  }
                ],
                "examples": [
                  "100%"
                ]
              },
              "flexDirection": {
                "oneOf": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "number"
                  }
                ],
                "examples": [
                  "row"
                ]
              },
              "backgroundColor": {
                "oneOf": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "number"
                  }
                ],
                "examples": [
                  "magenta"
                ]
              }
            }
          },
          "dependency": {
            "type": "object",
            "additionalProperties": false,
            "required": ["type"],
            "properties": {
              "type": {"type": "string", "examples": ["package", "local", "library"]},
              "path": {"type": "string"},
              "version": {"type": "string", "default": "1.0.0"},
              "meta": {
                "type": "object", 
                "additionalProperties": false,
                "properties": {
                  "namedImport": {"type": "boolean", "default": false},
                  "originalName": {"type": "string"}
                }
              }
            }
          },
          "propDefinitions": {
            "type": "object",
            "patternProperties": {
              ".*": {
                "type": "object",
                "additionalProperties": false,
                "required": ["type"],
                "properties": {
                  "type": {"type": "string"},
                  "defaultValue": {}
                }
              }
            }
          },
          "stateDefinitions": {
            "type": "object",
            "patternProperties": {
              ".*": {
                "type": "object",
                "additionalProperties": false,
                "required": ["type", "defaultValue"],
                "properties": {
                  "type": {"type": "string"},
                  "values": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "value": {},
                        "meta": { 
                          "type": "object",
                          "properties": {
                            "componentName": { "type": "string" },
                            "path": { "type": "string" },
                            "fileName": { "type": "string" }
                          }
                        },
                        "transitions": { "type": "object" }
                      }
                    }
                  },
                  "defaultValue": {},
                  "actions": {"type": "array"}
                }
              }
            }
          }
        }
      }
    }]
  });

  editor = monaco.editor.create(document.getElementById('editor'), {
    language: 'json',
    theme: 'vs-dark',
    minimap: {
      enabled: false
    },
    model: model,
    automaticLayout: true
  })

  editor.getModel().updateOptions({ tabSize: 2 })

  editor.model.onDidChangeContent((event) => {
    // console.log('event', name)
    try {
      // console.log(window.parent.editors[name])
      window.parent.editors[name].post({
        event: 'onDidChangeContent',
        value: editor.getValue(),
        event
      })
    } catch (error) {
      console.log(error)
    }
    
  })
})




