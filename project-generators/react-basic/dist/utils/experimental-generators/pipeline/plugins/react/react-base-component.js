import * as t from '@babel/types';
import { addChildJSXTag, addChildJSXText, addASTAttributeToJSXTag, generateASTDefinitionForJSXTag, addDynamicChild, addDynamicPropOnJsxOpeningTag, } from '../../utils/jsx-ast';
import { makeDefaultExport } from '../../utils/js-ast';
const addAttributesToTag = (tag, attrs) => {
    Object.keys(attrs).forEach((key) => {
        if (attrs[key].startsWith('$props.')) {
            const dynamicPropValue = attrs[key].replace('$props.', '');
            addDynamicPropOnJsxOpeningTag(tag, key, dynamicPropValue);
        }
        else {
            addASTAttributeToJSXTag(tag, { name: key, value: attrs[key] });
        }
    });
};
const addTextElementToTag = (tag, text) => {
    if (text.startsWith('$props.') && !text.endsWith('$props.')) {
        addDynamicChild(tag, text.replace('$props.', ''));
    }
    else {
        addChildJSXText(tag, text);
    }
};
const generateTreeStructure = (content, uidlMappings = {}, resolver, registerDependency) => {
    const { type, children, name, attrs, dependency } = content;
    const mappedElement = resolver(type, attrs, dependency);
    const mappedNodeName = mappedElement.nodeName;
    const mainTag = generateASTDefinitionForJSXTag(mappedNodeName);
    if (mappedNodeName === undefined) {
        console.error('mappedType erorr for uidl content', content);
        throw new Error(`mappedType not found for ${type}`);
    }
    addAttributesToTag(mainTag, mappedElement.attrs);
    if (mappedElement.dependency) {
        registerDependency(mappedNodeName, { ...mappedElement.dependency });
    }
    if (children) {
        if (Array.isArray(children)) {
            children.forEach((child) => {
                if (!child) {
                    return;
                }
                if (typeof child === 'string') {
                    addTextElementToTag(mainTag, child);
                    return;
                }
                const childTag = generateTreeStructure(child, uidlMappings, resolver, registerDependency);
                if (!childTag) {
                    return;
                }
                addChildJSXTag(mainTag, childTag);
            });
        }
        else {
            const textElement = children.toString();
            addTextElementToTag(mainTag, textElement);
        }
    }
    uidlMappings[name] = mainTag;
    return mainTag;
};
const makePureComponent = (params) => {
    const { name, jsxTagTree } = params;
    const returnStatement = t.returnStatement(jsxTagTree);
    const arrowFunction = t.arrowFunctionExpression([t.identifier('props')], t.blockStatement([returnStatement] || []));
    const declarator = t.variableDeclarator(t.identifier(name), arrowFunction);
    const component = t.variableDeclaration('const', [declarator]);
    return component;
};
export const createPlugin = (config) => {
    const { componentChunkName = 'react-component', exportChunkName = 'export', importChunkName = 'import', } = config || {};
    const reactComponentPlugin = async (structure, operations) => {
        const { uidl } = structure;
        const { resolver, registerDependency } = operations;
        registerDependency('React', {
            type: 'library',
            meta: {
                path: 'react',
            },
        });
        const uidlMappings = {};
        const jsxTagStructure = generateTreeStructure(uidl.content, uidlMappings, resolver, registerDependency);
        const pureComponent = makePureComponent({
            name: uidl.name,
            jsxTagTree: jsxTagStructure,
        });
        structure.chunks.push({
            type: 'js',
            name: componentChunkName,
            linker: {
                after: [importChunkName],
            },
            meta: {
                uidlMappings,
            },
            content: pureComponent,
        });
        structure.chunks.push({
            type: 'js',
            name: exportChunkName,
            linker: {
                after: [componentChunkName],
            },
            content: makeDefaultExport(uidl.name),
        });
        return structure;
    };
    return reactComponentPlugin;
};
export default createPlugin();
//# sourceMappingURL=react-base-component.js.map