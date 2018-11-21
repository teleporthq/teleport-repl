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
    "id": "1",
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
        "id": "2",
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
        "id": "3",
        "type": "Datepicker",
        "name": "Picker",
        "style": {
          "margin": "1px" 
        }
      }
    ]
  }
}