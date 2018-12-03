import ComponentAsemblyLine from '../../../utils/experimental-generators/pipeline/asembly-line';
import Builder from '../../../utils/experimental-generators/pipeline/builder';
import { createPlugin as reactComponent } from '../../../utils/experimental-generators/pipeline/plugins/react/react-base-component';
import { createPlugin as reactStyledJSX } from '../../../utils/experimental-generators/pipeline/plugins/react/react-styled-jsx';
import { createPlugin as reactJSS } from '../../../utils/experimental-generators/pipeline/plugins/react/react-jss';
import { createPlugin as reactInlineStyles } from '../../../utils/experimental-generators/pipeline/plugins/react/react-inline-styles';
import { createPlugin as reactPropTypes } from '../../../utils/experimental-generators/pipeline/plugins/react/react-proptypes';
import { createPlugin as importStatements } from '../../../utils/experimental-generators/pipeline/plugins/common/import-statements';
export var ReactComponentFlavors;
(function (ReactComponentFlavors) {
    ReactComponentFlavors[ReactComponentFlavors["InlineStyles"] = 0] = "InlineStyles";
    ReactComponentFlavors[ReactComponentFlavors["StyledJSX"] = 1] = "StyledJSX";
    ReactComponentFlavors[ReactComponentFlavors["JSS"] = 2] = "JSS";
})(ReactComponentFlavors || (ReactComponentFlavors = {}));
const configureAsemlyLine = (params) => {
    const { variation } = params;
    const configuredReactJSX = reactComponent({
        componentChunkName: 'react-component',
        importChunkName: 'import',
        exportChunkName: 'export',
    });
    const configuredReactStyledJSX = reactStyledJSX({
        componentChunkName: 'react-component',
    });
    const configuredReactJSS = reactJSS({
        componentChunkName: 'react-component',
        importChunkName: 'import',
        exportChunkName: 'export',
    });
    const configuredReactInlineStyles = reactInlineStyles({
        componentChunkName: 'react-component',
    });
    const configuredPropTypes = reactPropTypes({
        componentChunkName: 'react-component',
    });
    const configureImportStatements = importStatements({
        importLibsChunkName: 'import',
    });
    const customMappings = {
        Datepicker: {
            name: 'ReactDatepicker',
            attrs: {
                'data-attr': 'test',
            },
            dependency: {
                type: 'package',
                meta: {
                    path: 'react-datepicker',
                    version: '1.0.2',
                    namedImport: false,
                },
            },
        },
    };
    const configureLocalDependencies = async (structure, operations) => {
        const dependencies = operations.getDependencies();
        Object.keys(dependencies).forEach((key) => {
            if (dependencies[key].type === 'local') {
                dependencies[key].meta.path = `./components/${key}`;
            }
        });
        return structure;
    };
    const Options = {
        [ReactComponentFlavors.InlineStyles]: [
            configuredReactJSX,
            configuredReactInlineStyles,
            configuredPropTypes,
            configureLocalDependencies,
            configureImportStatements,
        ],
        [ReactComponentFlavors.StyledJSX]: [
            configuredReactJSX,
            configuredReactStyledJSX,
            configuredPropTypes,
            configureLocalDependencies,
            configureImportStatements,
        ],
        [ReactComponentFlavors.JSS]: [
            configuredReactJSX,
            configuredReactJSS,
            configuredPropTypes,
            configureLocalDependencies,
            configureImportStatements,
        ],
    };
    const generateComponentChunks = async (jsDoc) => {
        const asemblyLine = new ComponentAsemblyLine('react', Options[variation], customMappings);
        const chunksLinker = new Builder();
        const result = await asemblyLine.run(jsDoc);
        const code = chunksLinker.link(result.chunks);
        return {
            ...result,
            code
        };
    };
    return generateComponentChunks;
};
export { configureAsemlyLine };
//# sourceMappingURL=react-component.js.map