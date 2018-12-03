import { addDynamicPropOnJsxOpeningTag } from '../../utils/jsx-ast';
import { makeConstAssign, makeJSSDefaultExport, objectToObjectExpression, } from '../../utils/js-ast';
import { cammelCaseToDashCase } from '../../utils/helpers';
const generateStyleTagStrings = (content, uidlMappings) => {
    let accumulator = {};
    if (content && typeof content === 'object') {
        const { style, children, name } = content;
        if (style) {
            const root = uidlMappings[name];
            const className = cammelCaseToDashCase(name);
            accumulator[className] = style;
            addDynamicPropOnJsxOpeningTag(root, 'className', `classes['${className}']`);
        }
        if (children && Array.isArray(children)) {
            children.forEach((child) => {
                const items = generateStyleTagStrings(child, uidlMappings);
                accumulator = {
                    ...accumulator,
                    ...items,
                };
            });
        }
    }
    return accumulator;
};
export const createPlugin = (config) => {
    const { componentChunkName = 'react-component', importChunkName = 'import', styleChunkName = 'jss-style-definition', exportChunkName = 'export', jssDeclarationName = 'style', } = config || {};
    const reactJSSComponentStyleChunksPlugin = async (structure, operations) => {
        const { uidl, chunks } = structure;
        const { registerDependency } = operations;
        const { content } = uidl;
        const componentChunk = chunks.find((chunk) => chunk.name === componentChunkName);
        if (!componentChunk) {
            return structure;
        }
        const jsxChunkMappings = componentChunk.meta.uidlMappings;
        const jssStyleMap = generateStyleTagStrings(content, jsxChunkMappings);
        if (!Object.keys(jssStyleMap).length) {
            return structure;
        }
        registerDependency('injectSheet', {
            type: 'library',
            meta: {
                path: 'react-jss',
            },
        });
        chunks.push({
            type: 'js',
            name: styleChunkName,
            linker: {
                after: [importChunkName],
            },
            content: makeConstAssign(jssDeclarationName, objectToObjectExpression(jssStyleMap)),
        });
        const exportChunk = chunks.find((chunk) => chunk.name === exportChunkName);
        const exportStatement = makeJSSDefaultExport(uidl.name, jssDeclarationName);
        if (exportChunk) {
            exportChunk.content = exportStatement;
            if (exportChunk.linker && exportChunk.linker.after) {
                exportChunk.linker.after.push(styleChunkName);
            }
            else {
                exportChunk.linker = exportChunk.linker || {};
                exportChunk.linker.after = [importChunkName, styleChunkName];
            }
        }
        else {
            chunks.push({
                type: 'js',
                name: exportChunkName,
                content: exportStatement,
                linker: {
                    after: [importChunkName, styleChunkName],
                },
            });
        }
        return structure;
    };
    return reactJSSComponentStyleChunksPlugin;
};
export default createPlugin();
//# sourceMappingURL=react-jss.js.map