import * as types from '@babel/types';
import { objectToObjectExpression } from './js-ast';
export const getClassAttribute = (jsxNode, params = { createIfNotFound: false }, t = types) => {
    const results = jsxNode.openingElement.attributes.filter((attribute) => {
        return attribute.type === 'JSXAttribute' && attribute.name.name === 'className';
    });
    if (!results[0] && params && params.createIfNotFound) {
        const createdClassAttribute = t.jsxAttribute(t.jsxIdentifier('className'), t.stringLiteral(''));
        jsxNode.openingElement.attributes.push(createdClassAttribute);
        return createdClassAttribute;
    }
    return results[0];
};
export const addClassStringOnJSXTag = (jsxNode, classString, t = types) => {
    const classAttribute = getClassAttribute(jsxNode, { createIfNotFound: true }, t);
    if (classAttribute.value && classAttribute.value.type === 'StringLiteral') {
        const classArray = classAttribute.value.value.split(' ');
        classArray.push(classString);
        classAttribute.value.value = classArray.join(' ').trim();
    }
    else {
        throw new Error('Attempted to set a class string literral on a jsx\
     tag wchih had an invalid className attribute');
    }
};
export const addDynamicPropOnJsxOpeningTag = (jsxASTNode, name, value, t = types) => {
    jsxASTNode.openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier(name), t.jsxExpressionContainer(t.memberExpression(t.identifier('props'), t.identifier(value)))));
};
export const stringAsTemplateLiteral = (str, t = types) => {
    const formmattedString = `
${str}
  `;
    return t.templateLiteral([
        t.templateElement({
            raw: formmattedString,
            cooked: formmattedString,
        }, true),
    ], []);
};
export const generateStyledJSXTag = (templateLiteral, t = types) => {
    if (typeof templateLiteral === 'string') {
        templateLiteral = stringAsTemplateLiteral(templateLiteral, t);
    }
    const jsxTagChild = t.jsxExpressionContainer(templateLiteral);
    const jsxTag = generateBasicJSXTag('style', [jsxTagChild, t.jsxText('\n')], t);
    addASTAttributeToJSXTag(jsxTag, { name: 'jsx' }, t);
    return jsxTag;
};
export const generateBasicJSXTag = (tagName, children = [], t = types) => {
    const jsxIdentifier = t.jsxIdentifier(tagName);
    const openingDiv = t.jsxOpeningElement(jsxIdentifier, [], false);
    const closingDiv = t.jsxClosingElement(jsxIdentifier);
    const tag = t.jsxElement(openingDiv, closingDiv, children, false);
    return tag;
};
const getProperAttributeValueAssignment = (value, t = types) => {
    switch (typeof value) {
        case 'string':
            return t.stringLiteral(value);
        case 'number':
            return t.jsxExpressionContainer(t.numericLiteral(value));
        case 'undefined':
            return null;
        default:
            return value;
    }
};
export const addASTAttributeToJSXTag = (jsxNode, attribute, t = types) => {
    const nameOfAttribute = t.jsxIdentifier(attribute.name);
    let attributeDefinition;
    if (typeof attribute.value === 'boolean') {
        attributeDefinition = t.jsxAttribute(nameOfAttribute);
    }
    else {
        attributeDefinition = t.jsxAttribute(nameOfAttribute, getProperAttributeValueAssignment(attribute.value));
    }
    jsxNode.openingElement.attributes.push(attributeDefinition);
};
export const generateASTDefinitionForJSXTag = (tagName, t = types) => {
    const jsxIdentifier = t.jsxIdentifier(tagName);
    const openingDiv = t.jsxOpeningElement(jsxIdentifier, [], false);
    const closingDiv = t.jsxClosingElement(jsxIdentifier);
    const tag = t.jsxElement(openingDiv, closingDiv, [], false);
    return tag;
};
export const addChildJSXTag = (tag, childNode) => {
    tag.children.push(types.jsxText('\n'), childNode, types.jsxText('\n'));
};
export const addChildJSXText = (tag, text, t = types) => {
    tag.children.push(t.jsxText(text));
};
export const addDynamicChild = (tag, value, t = types) => {
    tag.children.push(t.jsxExpressionContainer(t.memberExpression(t.identifier('props'), t.identifier(value))));
};
export const addJSXTagStyles = (tag, styleMap, t = types) => {
    const styleObjectExpression = objectToObjectExpression(styleMap, t);
    const styleObjectExpressionContainer = t.jsxExpressionContainer(styleObjectExpression);
    const styleJSXAttr = t.jsxAttribute(t.jsxIdentifier('style'), styleObjectExpressionContainer);
    tag.openingElement.attributes.push(styleJSXAttr);
};
//# sourceMappingURL=jsx-ast.js.map