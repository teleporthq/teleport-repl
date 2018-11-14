import * as t from "@babel/types";
import generator from "@babel/generator";
import * as prettier from "prettier/standalone";

// STILL NEEDED BECAUSE SOME JSX TAG SYNTAX BREAKS WITH OUR AST...
import parserPlugin from "prettier/parser-babylon";

import JSXTag from "./JSXTag";

const generateTreeStructure = (content: any): JSXTag => {
  const { type, children, style } = content;
  const mappedType = type === "Text" ? "span" : "div";
  const mainTag = new JSXTag(mappedType);
  if (style) {
    mainTag.addInlineStyle(style);
  }

  if (children) {
    if (Array.isArray(children)) {
      children.forEach(child => {
        if ( !child ) {
          return;
        }
        const newTag = generateTreeStructure(child);
        if ( !newTag ) {
          return;
        }
        mainTag.addChildJSXTag(newTag.node);
      });
    } else {
      mainTag.addChildJSXText(children.toString());
    }
  }

  return mainTag;
};

const makePureComponent = (params: {name:string, jsxTagTree: any}) => {
  const { name, jsxTagTree } = params;
  const returnStatement = t.returnStatement(
    jsxTagTree
  )
  const arrowFunction = t.arrowFunctionExpression(
    [t.identifier('props')],
    t.blockStatement([returnStatement] || [])
  )

  const declarator = t.variableDeclarator(
    t.identifier(name),
    arrowFunction
  )
  const component = t.variableDeclaration('const', [declarator])

  return component;
}

const makeDefaultExportByName = (name:string) => {
  return t.exportDefaultDeclaration(
    t.identifier(name)
  )
}

const generateComponent = (jsDoc: any) => {
  const parentTag = generateTreeStructure(jsDoc.content);
  const componentName = 'MySpecialComponent'
  const componentDeclaration = makePureComponent({
    name: componentName, 
    jsxTagTree: parentTag.node
  })

  const ast2 = t.file( t.program([
    componentDeclaration, 
    makeDefaultExportByName(componentName)
  ]), null, [] )

  const oneLinerCode = generator(ast2).code;

  // inject our AST into prettier, by faking a parser implementation and 
  // sending a empty string to prettier. Prettier won't parse anything,
  // we will send the AST we generated, and prettier will then apply
  // the formatiing on our AST. 
  const formatted = prettier.format(oneLinerCode, {
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    semi: false,
    singleQuote: false,
    trailingComma: "none",
    bracketSpacing: true,
    jsxBracketSameLine: false,

    parser: 'babylon',
    plugins: [parserPlugin]
  })

  return formatted;
}

export { generateComponent }