/* tslint:disable */
export default {
  "version": "1.1",
  "root": "App",
  "components": {

    "PageTitle": {
      "name": "PageTitle", // not really used, not a unique identifier or anything
      "type": "PageHeading", // resolved by mapping to h1
      "content": {
        "name": "Useless",
        "type": "Text", // this is confusing, why do I have to define two types for just
                               // some text?
        "children": "$props.children"
      }
    },

    "Home": {
      "version": "1",
      "name": "Home", // not really used, the instance will have a name, not the declaration
      "type": "View", // confused, which one is it now? The type is from home or from content? 
      "content": {
        "type": "View",
        "name": "HomeContent",
        "style": {
          "textAlign": "center",
          "color": "yellow",
          "border": "1px solid #000"  // this is common between homepage and about
        },
        "children": [{
          "type": "PageTitle",
          "name": "HomeTitleInstance", // page title will not get name PageTitle, but HomeTitle
                               // PageTitle is redundant in the "PageTitle" declaration
          "children": "Home Page", // will be passed to $props.children as children
          "dependency": { 
            "type": "local"
          } 
        }]
      }
    },

    "About": {
      "version": "1",
      "name": "About",
      "type": "View",
      "content": {
        "type": "View",
        "name": "AboutContent",
        "style": {
          "textAlign": "left",
          "color": "red",
          "border": "1px solid #000" // this is common between homepage and about
        },
        "children": [{
          "type": "PageTitle",
          "name": "AboutTitleInstance",
          "children": "About Page",
          "dependency": { 
            "type": "local"
          }
        }]
      }
    },

    "App": {
      "version": "1",
      "name": "App", // only time where name actually makes sense on the component
                     // is on the root.

      "states": {

        "home": {
          "default": true,
          "content": {
            "name": "HomeInstance",
            "type": "Home",
            "dependency": { 
              "type": "local"
            }
          }
        },

        "about": {
          "content": {
            "name": "AboutInstance",
            "type": "About",
            "dependency": { 
              "type": "local"
            }
          }
        }

      }
    
    }
  }
}