export default {
    "version": "1.1",
    "root": "App",
    "components": {
        "PageTitle": {
            "name": "PageTitle",
            "type": "PageHeading",
            "content": {
                "name": "Useless",
                "type": "Text",
                "children": "$props.children"
            }
        },
        "Home": {
            "version": "1",
            "name": "Home",
            "type": "View",
            "content": {
                "type": "View",
                "name": "HomeContent",
                "style": {
                    "textAlign": "center",
                    "color": "yellow",
                    "border": "1px solid #000"
                },
                "children": [{
                        "type": "PageTitle",
                        "name": "HomeTitleInstance",
                        "children": "Home Page",
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
                    "border": "1px solid #000"
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
            "name": "App",
            "states": {
                "default": "home",
                "home": {
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
};
//# sourceMappingURL=component-states.js.map