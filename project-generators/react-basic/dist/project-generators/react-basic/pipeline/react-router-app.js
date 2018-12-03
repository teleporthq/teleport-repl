import * as t from '@babel/types';
import { generateASTDefinitionForJSXTag } from '../../../utils/experimental-generators/pipeline/utils/jsx-ast';
const makePureComponent = (params) => {
    const { name, jsxTagTree } = params;
    const returnStatement = t.returnStatement(jsxTagTree);
    const arrowFunction = t.arrowFunctionExpression([t.identifier('props')], t.blockStatement([returnStatement] || []));
    const declarator = t.variableDeclarator(t.identifier(name), arrowFunction);
    const component = t.variableDeclaration('const', [declarator]);
    return component;
};
export const createPlugin = (config) => {
    const { importChunkName = 'imports', componentChunkName = 'app-routing-component', domRenderChunkName = 'app-routing-bind-to-dom', } = config || {};
    const reactAppRoutingComponentPlugin = async (structure, operations) => {
        const { uidl } = structure;
        const { resolver, registerDependency } = operations;
        registerDependency('React', {
            type: 'library',
            meta: {
                path: 'react',
            },
        });
        registerDependency('ReactDOM', {
            type: 'library',
            meta: {
                path: 'react-dom',
            },
        });
        registerDependency('Router', {
            type: 'library',
            meta: {
                path: 'react-router-dom',
                namedImport: true,
                originalName: 'BrowserRouter',
            },
        });
        registerDependency('Route', {
            type: 'library',
            meta: {
                path: 'react-router-dom',
                namedImport: true,
            },
        });
        const { states, content } = uidl;
        const pages = states || {};
        if (content) {
            pages.default = 'index';
            pages.index = content;
        }
        const mappings = {
            routes: [],
        };
        const rootRouterTag = generateASTDefinitionForJSXTag('Router');
        const routeDefinitions = Object.keys(pages)
            .filter((pageKey) => pageKey !== 'default')
            .map((pageKey) => {
            const { content: stateComponent } = pages[pageKey];
            const { type, attrs, dependency } = stateComponent;
            const mappedElement = resolver(type, attrs, dependency);
            const route = generateASTDefinitionForJSXTag('Route');
            const urlRoute = pages.default === pageKey ? '/' : `/${pageKey.toLocaleLowerCase()}`;
            registerDependency(mappedElement.nodeName, {
                type: 'local',
                meta: {
                    path: `./components/${mappedElement.nodeName}`,
                },
            });
            route.openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier('url'), t.stringLiteral(urlRoute)));
            route.openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier('component'), t.jsxExpressionContainer(t.identifier(mappedElement.nodeName))));
            return route;
        });
        rootRouterTag.children.push(...routeDefinitions);
        mappings.routes = routeDefinitions;
        const pureComponent = makePureComponent({
            name: uidl.name,
            jsxTagTree: rootRouterTag,
        });
        structure.chunks.push({
            type: 'js',
            name: componentChunkName,
            linker: {
                after: [importChunkName],
            },
            meta: {
                mappings,
            },
            content: pureComponent,
        });
        const reactDomBind = t.expressionStatement(t.callExpression(t.memberExpression(t.identifier('ReactDOM'), t.identifier('render')), [
            t.identifier(uidl.name),
            t.callExpression(t.memberExpression(t.identifier('document'), t.identifier('getElementById')), [t.stringLiteral('root')]),
        ]));
        structure.chunks.push({
            type: 'js',
            name: domRenderChunkName,
            linker: {
                after: [componentChunkName],
            },
            content: reactDomBind,
        });
        return structure;
    };
    return reactAppRoutingComponentPlugin;
};
export default createPlugin();
//# sourceMappingURL=react-router-app.js.map