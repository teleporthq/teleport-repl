import preset from 'jss-preset-default';
import jss from 'jss';
jss.setup(preset());
import { addClassStringOnJSXTag, generateStyledJSXTag } from '../../utils/jsx-ast';
import { cammelCaseToDashCase } from '../../utils/helpers';
const generateStyledJSXString = (content, uidlMappings) => {
    let accumulator = [];
    if (content && typeof content === 'object') {
        const { style, children, name } = content;
        if (style) {
            const root = uidlMappings[name];
            const className = cammelCaseToDashCase(name);
            accumulator.push(jss
                .createStyleSheet({
                [`.${className}`]: style,
            }, {
                generateClassName: () => className,
            })
                .toString());
            addClassStringOnJSXTag(root, className);
        }
        if (children && Array.isArray(children)) {
            children.forEach((child) => {
                const items = generateStyledJSXString(child, uidlMappings);
                accumulator = accumulator.concat(...items);
            });
        }
    }
    return accumulator;
};
export const createPlugin = (config) => {
    const { componentChunkName = 'react-component' } = config || {};
    const reactStyledJSXChunkPlugin = async (structure) => {
        const { uidl, chunks } = structure;
        const { content } = uidl;
        const componentChunk = chunks.find((chunk) => chunk.name === componentChunkName);
        if (!componentChunk) {
            return structure;
        }
        const jsxChunkMappings = componentChunk.meta.uidlMappings;
        const styleJSXString = generateStyledJSXString(content, jsxChunkMappings);
        const jsxASTNodeReference = generateStyledJSXTag(styleJSXString.join('\n'));
        const rootJSXNode = jsxChunkMappings[content.name];
        rootJSXNode.children.push(jsxASTNodeReference);
        return structure;
    };
    return reactStyledJSXChunkPlugin;
};
export default createPlugin();
//# sourceMappingURL=react-styled-jsx.js.map