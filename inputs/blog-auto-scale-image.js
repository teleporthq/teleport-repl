/* tslint:disable */
export default {
  "version": "1",
  "name": "AutoScaleImage",
  "content": {
    "name": "ImageContainer",
    "type": "View",
    "style": {
      "textAlign": "center"
    },
    "children": [
      {
        "name": "Image",
        "type": "Image",
        "style": {
          "maxWidth": "100%",
          "height": "auto",
          "marginTop": "30px"
        },
        "attrs": {
          "url": "$props.src",
          "alt": "$props.alt"
        }
      }
    ]
  }
}