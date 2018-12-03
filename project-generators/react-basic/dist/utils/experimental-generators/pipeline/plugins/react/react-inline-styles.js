import * as t from '@babel/types';
import { addJSXTagStyles } from '../../utils/jsx-ast';
const enhanceJSXWithStyles = (content, uidlMappings) => {
    const { children, style, name } = content;
    if (style) {
        const jsxASTTag = uidlMappings[name];
        if (!jsxASTTag) {
            return;
        }
        addJSXTagStyles(jsxASTTag, style, t);
    }
    if (Array.isArray(children)) {
        children.forEach((child) => enhanceJSXWithStyles(child, uidlMappings));
    }
};
export const createPlugin = (config) => {
    const { componentChunkName = 'react-component' } = config || {};
    const reactInlineStyleComponentPlugin = async (structure) => {
        const { uidl, chunks } = structure;
        const componentChunk = chunks.find((chunk) => chunk.name === componentChunkName);
        if (!componentChunk) {
            return structure;
        }
        enhanceJSXWithStyles(uidl.content, componentChunk.meta.uidlMappings);
        return structure;
    };
    return reactInlineStyleComponentPlugin;
};
export default createPlugin();
//# sourceMappingURL=react-inline-styles.js.map