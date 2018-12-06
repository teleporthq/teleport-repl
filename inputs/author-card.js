/* tslint:disable */
export default {
  "version": "v1",
  "name": "AuthorCard",
  "propDefinitions": {
    "authorName": {
      "type": "string",
      "defaultValue": "TeleportHQ Rocks"
    },
    "avatarUrl": {
      "type": "string",
      "defaultValue": "https://picsum.photos/150/150"
    },
    "direction": {
      "type": "string",
      "defaultValue": "row"
    }
  },
  "content": {
    "type": "View",
    "name": "View",
    "style": {
      "width": "100%",
      "height": "100%",
      "display": "flex",
      "flexDirection": "$props.direction"
    },
    "children": [
      {
        "type": "View",
        "name": "image-container",
        "style": {
          "backgroundColor": "#333",
          "borderRadius": "50%",
          "display": "block",
          "width": 150,
          "height": 150,
          "overflow": "hidden",
          "border": "none"
        },
        "children": [
          {
            "type": "Image",
            "name": "img",
            "attrs": {
              "src": "$props.avatarUrl",
              "alt": "$props.authorName"
            }
          }
        ]
      },
      {
        "type": "View",
        "name": "details-container",
        "style": {
          "flexDirection": "column",
          "flex": 1,
          "marginLeft": "20px"
        },
        "children": [
          {
            "type": "h3",
            "name": "autor-name",
            "children": "$props.authorName"
          },
          {
            "type": "View",
            "name": "autor-desription",
            "children": "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla laoreet metus a nulla rhoncus, et aliquet turpis lacinia."
          }
        ]
      }
    ]
  }
}