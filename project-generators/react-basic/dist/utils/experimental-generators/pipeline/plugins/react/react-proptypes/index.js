import { buildDefaultPropsAst, buildTypesOfPropsAst } from './utils';
export const createPlugin = (config) => {
    const { componentChunkName = 'react-component', defaultPropsChunkName = 'react-component-default-props', typesOfPropsChunkName = 'react-component-types-of-props', exportComponentName = 'export', } = config || {};
    const reactJSPropTypesChunkPlugin = async (structure, { registerDependency }) => {
        const { uidl, chunks } = structure;
        const { name } = uidl;
        const componentChunk = chunks.filter((chunk) => chunk.name === componentChunkName)[0];
        const exportChunk = chunks.filter((chunk) => chunk.name === exportComponentName)[0];
        if (!componentChunk) {
            throw new Error(`React component chunk with name ${componentChunkName} was reuired and not found.`);
        }
        const defaultPropsAst = buildDefaultPropsAst(name, uidl.propDefinitions);
        const typesOfPropsAst = buildTypesOfPropsAst(name, 'PropTypes', uidl.propDefinitions);
        if (!defaultPropsAst && !typesOfPropsAst) {
            return structure;
        }
        registerDependency('PropTypes', {
            type: 'library',
            meta: {
                path: 'prop-types',
            },
        });
        chunks.push({
            type: 'js',
            name: defaultPropsChunkName,
            linker: {
                after: [componentChunkName],
            },
            content: defaultPropsAst,
        });
        chunks.push({
            type: 'js',
            name: typesOfPropsChunkName,
            linker: {
                after: [componentChunkName],
            },
            content: typesOfPropsAst,
        });
        if (!exportChunk.linker) {
            exportChunk.linker = {};
        }
        if (!exportChunk.linker.after) {
            exportChunk.linker.after = [];
        }
        exportChunk.linker.after.push(typesOfPropsChunkName, defaultPropsChunkName);
        return structure;
    };
    return reactJSPropTypesChunkPlugin;
};
export default createPlugin();
//# sourceMappingURL=index.js.map