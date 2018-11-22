/* tslint:disable */
export default {
  "version": "v1",
  "name": "TestComponent",
  "propDefinitions": {
    "test": {
      "type": "string",
      "defaultValue": "test"
    }
  },
  "content": {
    "type": "View",
    "name": "View",
    "style": {
      "width": "100%",
      "height": "100%",
      "flexDirection": "row",
      "backgroundColor": "magenta"
    },
    "children": [
      {
        "type": "Text",
        "name": "Text",
        "children": "Hello world!",
        "style": {
          "width": "100%",
          "height": "100%",
          "flexDirection": "row",
          "backgroundColor": "pink"
        }
      },
      {
        "type": "Datepicker",
        "name": "Picker",
        "style": {
          "margin": "1px" 
        }
      }
    ]
  }
}