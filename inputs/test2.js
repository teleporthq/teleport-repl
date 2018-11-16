/* tslint:disable */
export default {
  "version": "v1",
  "name": "TestComponent",
  "content": {
    "type": "View",
    "source": "letsmakethisoptional",
    "name" : "View", 
    "style" : {
        "width" : "100%", 
        "height" : "100%", 
        "flexDirection" : "row", 
        "backgroundColor" : "magenta"
    },
    "children": [
      {
        "type" : "View", 
        "source" : "letsmakethisoptional",
        "name" : "View2", 
        "children": [
           {
            "type" : "View", 
            "source" : "letsmakethisoptional",
            "name" : "Text22", 
            "children": "Hello world!"
          },
           {
            "type" : "View", 
            "source" : "letsmakethisoptional",
            "name" : "Text23", 
            "children": "Hello world!"
          }
        ],
        "style" : {
            "width" : "100%", 
            "height" : "100%", 
            "flexDirection" : "row", 
            "backgroundColor" : "lightblue",
            "display": "flex"
        }
      }
    ]
  }
  }