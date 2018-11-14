import * as t from "@babel/types";

import {
  generateASTDefinitionForJSXTag,
  addASTAttributeToJSXTag,
  addJSXTagStyles
} from "./utils";

// jsx attribute can be strings, numbers, booleans, objects.
// TODO they could also be expressions, functions and so on, but those will be implemented later.
export type JSXAttriuteValue = string | number | boolean | object;

export interface JSXAttributeNameValuePair {
  name: string;
  value: JSXAttriuteValue;
}

export interface JSXAttributeMap {
  [key: string]: JSXAttriuteValue;
}

export interface JSXTagParams {
  tagName?: string;
}

const defaultProps = {
  tagName: "div"
};

export default class JSXTag {
  public node: any;

  constructor(tagName: string = "div", params?: JSXTagParams) {
    const instanceOptions = {
      ...defaultProps,
      ...params,
      tagName
    };
    this.node = generateASTDefinitionForJSXTag(t, instanceOptions);
  }

  public addAttribute = (attr: JSXAttributeNameValuePair) => {
    addASTAttributeToJSXTag(this.node, t, attr);
  };

  public addAttributes(attrs: JSXAttributeNameValuePair[]) {
    attrs.forEach(this.addAttribute);
  }

  public addAttributesMap(attrs: JSXAttributeMap) {
    const attrArray = Object.keys(attrs).reduce((acc: JSXAttributeNameValuePair[], key) => {
      acc.push({
        name: key,
        value: attrs[key]
      });
      return acc;
    }, []);

    this.addAttributes(attrArray);
  }

  public addChild(validJSXChild: t.JSXElement | t.JSXText) {
    this.node.children.push(validJSXChild);
  }

  public addChildJSXTag(jsxTagNode: t.JSXElement) {
    this.node.children.push(jsxTagNode);
  }

  public addChildJSXText(jsxTagNode: string) {
    this.node.children.push(t.jsxText(jsxTagNode));
  }

  public addInlineStyle(styleObject: { [key: string]: string | number }) {
    addJSXTagStyles(this.node, t, styleObject);
  }
}
