/* tslint:disable */
export default {
  "version": "v1",
  "name": "CenteredImage",
  "content": {
    "type": "View",
    "source": "teleport-elements-core",
    "name": "View",
    "style": {
      "width": "100%",
      "height": "100%",
      "display": "flex",
      "flexDirection": "row",
      "justifyContent": "center"
    },
    "children": [
      {
        "type": "Image",
        "source": "teleport-elements-core",
        "name": "Text",
        "style": {
          "display": "block"
        },
        "attrs": {
          "src": "http://lorempixel.com/200/150/"
        }
      }
    ]
  }
}