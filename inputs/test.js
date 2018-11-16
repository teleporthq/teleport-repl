/* tslint:disable */
export default {
  "version": "v1",
  "name": "TestComponent",
  "content": {
    "type": "View",
    "source": "teleport-elements-core",
    "name" : "View", 
    "style" : {
        "width" : "100%", 
        "height" : "100%", 
        "flexDirection" : "row", 
        "backgroundColor" : "magenta"
    },
    "children": [
      {
        "type" : "Text", 
        "source" : "teleport-elements-core",
        "name" : "Text", 
        "children": "Hello world!",
        "style" : {
            "width" : "100%", 
            "height" : "100%", 
            "flexDirection" : "row", 
            "backgroundColor" : "pink"
        }
      }
    ]
  }
  }