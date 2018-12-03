import { makeGenericImportStatement } from '../../utils/js-ast';
const groupDependenciesByPackage = (dependencies, packageType) => {
    const result = {};
    Object.keys(dependencies)
        .filter((key) => (packageType && dependencies[key].type === packageType) || !packageType)
        .map((key) => {
        const dep = dependencies[key];
        const packagePath = dep.meta.path;
        if (!result[packagePath]) {
            result[packagePath] = [];
        }
        result[packagePath].push({
            identifier: key,
            namedImport: !!dep.meta.namedImport,
            originalName: dep.meta.originalName || key,
        });
    });
    return result;
};
const addImportChunk = (chunks, dependencies, newChunkName) => {
    const importASTs = Object.keys(dependencies).map((key) => makeGenericImportStatement(key, dependencies[key]));
    if (importASTs.length > 0) {
        chunks.push({
            type: 'js',
            name: newChunkName,
            content: importASTs,
        });
    }
};
export const createPlugin = (config) => {
    const { importLibsChunkName = 'import-libs', importPackagesChunkName = 'import-packages', importLocalsChunkName = 'import-local', } = config || {};
    const importPlugin = async (structure, operations) => {
        const dependencies = operations.getDependencies();
        const libraryDependencies = groupDependenciesByPackage(dependencies, 'library');
        const packageDependencies = groupDependenciesByPackage(dependencies, 'package');
        const localDependencies = groupDependenciesByPackage(dependencies, 'local');
        addImportChunk(structure.chunks, libraryDependencies, importLibsChunkName);
        addImportChunk(structure.chunks, packageDependencies, importPackagesChunkName);
        addImportChunk(structure.chunks, localDependencies, importLocalsChunkName);
        return structure;
    };
    return importPlugin;
};
export default createPlugin();
//# sourceMappingURL=import-statements.js.map