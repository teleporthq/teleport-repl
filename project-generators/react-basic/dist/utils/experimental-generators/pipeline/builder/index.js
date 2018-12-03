import { generator as babelCodeGenerator } from './generators/js-ast-to-code';
import { generator as cheerioHTMLGenerator } from './generators/html-to-string';
const removeItemsInArray = (arrayToRemoveFrom, itemsToRemove) => {
    return arrayToRemoveFrom.filter((item) => {
        return itemsToRemove.indexOf(item) === -1;
    });
};
const removeChildDependency = (children, targetChunkName) => {
    return children.reduce((acc, child) => {
        if (child.chunkName !== targetChunkName) {
            acc.push(child);
        }
        return acc;
    }, []);
};
export default class Builder {
    constructor(chunkDefinitions) {
        this.chunkDefinitions = [];
        this.generators = {
            js: babelCodeGenerator,
            html: cheerioHTMLGenerator,
            string: (a) => a,
        };
        if (chunkDefinitions) {
            this.chunkDefinitions = chunkDefinitions;
        }
    }
    link(chunkDefinitions) {
        const chunks = chunkDefinitions || this.chunkDefinitions;
        if (!chunks || !chunks.length) {
            return '';
        }
        const dependencies = {};
        chunks.forEach((chunk) => {
            const linker = chunk.linker || {};
            if (!dependencies[chunk.name]) {
                dependencies[chunk.name] = {
                    after: [],
                    children: [],
                    embed: null,
                    chunk: null,
                };
            }
            dependencies[chunk.name].chunk = chunk;
            if (linker.after) {
                dependencies[chunk.name].after = dependencies[chunk.name].after.concat(linker.after);
                linker.after.map((key) => {
                    if (!dependencies[key]) {
                        dependencies[key] = {
                            after: [],
                            children: [],
                            embed: null,
                            chunk: null,
                        };
                    }
                });
            }
            if (linker.embed) {
                if (!dependencies[linker.embed.chunkName]) {
                    dependencies[linker.embed.chunkName] = {
                        after: [],
                        children: [],
                        embed: null,
                        chunk: null,
                    };
                }
                dependencies[linker.embed.chunkName].children.push({
                    chunkName: chunk.name,
                    slot: linker.embed.slot,
                });
                dependencies[chunk.name].embed = linker.embed;
            }
        });
        Object.keys(dependencies).forEach((key) => {
            if (!dependencies[key].chunk) {
                throw new Error(`chunk with name ${key} was referenced by other chunks but not found.`);
            }
        });
        let keys = Object.keys(dependencies);
        const totalOrder = [];
        let localOrder = [];
        let keyLen = keys.length;
        while (keys && keys.length) {
            localOrder = [];
            keyLen = keys.length;
            keys = keys.reduce((newKeys, key) => {
                const itDependnecy = dependencies[key];
                if (itDependnecy.after.length === 0 &&
                    itDependnecy.children.length === 0 &&
                    itDependnecy.embed === null) {
                    localOrder.push(key);
                }
                else {
                    newKeys.push(key);
                }
                return newKeys;
            }, []);
            keys.forEach((key) => {
                const itDependnecy = dependencies[key];
                itDependnecy.after = removeItemsInArray(itDependnecy.after, localOrder);
            });
            const embededChildren = [];
            keys.forEach((key) => {
                const { embed, children, after, chunk } = dependencies[key];
                if (chunk && embed && children.length === 0 && after.length === 0) {
                    const parentDefinition = dependencies[embed.chunkName];
                    dependencies[embed.chunkName].children = removeChildDependency(dependencies[embed.chunkName].children, key);
                    embededChildren.push(key);
                    if (parentDefinition.chunk &&
                        parentDefinition.chunk.linker &&
                        parentDefinition.chunk.linker.slots) {
                        parentDefinition.chunk.linker.slots[embed.slot]([chunk]);
                    }
                }
            });
            keys.forEach((key) => {
                const itDependnecy = dependencies[key];
                itDependnecy.after = removeItemsInArray(itDependnecy.after, embededChildren);
            });
            keys = removeItemsInArray(keys, embededChildren);
            totalOrder.push(...localOrder);
            if (keyLen === keys.length) {
                console.error('something went wrog, we did not chage aything in one iteration');
                break;
            }
        }
        const resultingString = [];
        totalOrder.map((key) => {
            const chunkToCompile = dependencies[key].chunk;
            if (chunkToCompile) {
                const { type, content, wrap } = chunkToCompile;
                let compiledContent = this.generateByType(type, content);
                if (wrap) {
                    compiledContent = wrap(compiledContent);
                }
                resultingString.push(compiledContent);
            }
        });
        return resultingString.join('\n');
    }
    generateByType(type, content) {
        if (Array.isArray(content)) {
            return content.map((contentItem) => this.generateByType(type, contentItem)).join('');
        }
        if (!this.generators[type]) {
            throw new Error(`Attempted to generate unkown type ${type}. Please register a generator for this type in builder/index.ts`);
        }
        return this.generators[type](content);
    }
}
//# sourceMappingURL=index.js.map