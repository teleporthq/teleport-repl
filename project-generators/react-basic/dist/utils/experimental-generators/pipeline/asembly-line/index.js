import htmlMappings from '../../element-mappings/html';
import reactMappings from '../../element-mappings/react';
import vueMappings from '../../element-mappings/vue';
const frameworkMappingsLookup = {
    react: reactMappings,
    vue: vueMappings,
};
export default class ComponentAsemblyLine {
    constructor(target, pipeline, customMappings = {}) {
        this.resolver = (uidlType, uidlAttrs, uidlDependency) => {
            let mappedElement = this.elementMappings[uidlType];
            const identityMapping = {
                name: uidlType,
            };
            mappedElement = mappedElement || identityMapping;
            const resolvedAttrs = {};
            const mappedAttributes = [];
            if (mappedElement.attrs) {
                Object.keys(mappedElement.attrs).forEach((key) => {
                    const value = mappedElement.attrs[key];
                    if (!value) {
                        return;
                    }
                    if (typeof value === 'string' && value.startsWith('$attrs.')) {
                        const uidlAttributeKey = value.replace('$attrs.', '');
                        if (uidlAttrs && uidlAttrs[uidlAttributeKey]) {
                            resolvedAttrs[key] = uidlAttrs[uidlAttributeKey];
                            mappedAttributes.push(uidlAttributeKey);
                        }
                        return;
                    }
                    resolvedAttrs[key] = mappedElement.attrs[key];
                });
            }
            if (uidlAttrs) {
                Object.keys(uidlAttrs).forEach((key) => {
                    if (!mappedAttributes.includes(key)) {
                        resolvedAttrs[key] = uidlAttrs[key];
                    }
                });
            }
            const nodeDependency = uidlDependency || mappedElement.dependency;
            if (nodeDependency) {
                nodeDependency.meta =
                    nodeDependency.meta && nodeDependency.meta.path
                        ? nodeDependency.meta
                        : { ...nodeDependency.meta, path: './' + mappedElement.name };
            }
            return {
                nodeName: mappedElement.name,
                attrs: resolvedAttrs,
                dependency: nodeDependency,
            };
        };
        this.registerDependency = (name, dependency) => {
            this.dependencies[name] = dependency;
        };
        this.plugins = pipeline;
        this.dependencies = {};
        const frameworkMappings = frameworkMappingsLookup[target];
        this.elementMappings = {
            ...htmlMappings,
            ...frameworkMappings,
            ...customMappings,
        };
    }
    async run(uidl, params) {
        const { initialStructure = {
            uidl,
            meta: null,
            chunks: [],
        }, customMappings = {}, } = params || {};
        let structure = initialStructure;
        const pipelineOperations = {
            registerDependency: this.registerDependency,
            resolver: this.resolver,
            getDependencies: () => this.dependencies,
        };
        this.elementMappings = { ...this.elementMappings, ...customMappings };
        const len = this.plugins.length;
        for (let i = 0; i < len; i++) {
            structure = await this.plugins[i](structure, pipelineOperations);
        }
        return {
            chunks: structure.chunks,
            dependencies: this.dependencies,
        };
    }
}
//# sourceMappingURL=index.js.map