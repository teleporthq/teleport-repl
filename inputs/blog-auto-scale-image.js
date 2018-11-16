/* tslint:disable */
export default {
  "version": "1",
  "name": "AutoScaleImage",
  "content": {
    "name": "ImageContainer",
    "type": "View",
    "source": "teleport-elements-core",
    "style": {
      "textAlign": "center"
    },
    "children": [
      {
        "name": "Image",
        "type": "Image",
        "source": "teleport-elements-core",
        "style": {
          "maxWidth": "100%",
          "height": "auto",
          "marginTop": "30px"
        },
        "attrs": {
          "src": "$props.src",
          "alt": "$props.alt"
        }
      }
    ]
  }
}