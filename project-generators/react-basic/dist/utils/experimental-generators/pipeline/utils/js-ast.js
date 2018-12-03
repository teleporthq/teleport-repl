import * as types from '@babel/types';
export class ParsedASTNode {
    constructor(ast) {
        this.ast = ast;
    }
}
export const objectToObjectExpression = (objectMap, t = types) => {
    const props = Object.keys(objectMap).reduce((acc, key) => {
        const keyIdentifier = t.stringLiteral(key);
        const value = objectMap[key];
        let computedLiteralValue = null;
        if (value instanceof ParsedASTNode) {
            computedLiteralValue = value.ast;
        }
        else if (typeof value === 'string') {
            computedLiteralValue = t.stringLiteral(value);
        }
        else if (typeof value === 'number') {
            computedLiteralValue = t.numericLiteral(value);
        }
        else if (typeof value === 'object') {
            computedLiteralValue = objectToObjectExpression(value, t);
        }
        else if (value === String) {
            computedLiteralValue = t.identifier('String');
        }
        else if (value === Number) {
            computedLiteralValue = t.identifier('Number');
        }
        if (computedLiteralValue) {
            acc.push(t.objectProperty(keyIdentifier, computedLiteralValue));
        }
        return acc;
    }, []);
    const objectExpression = t.objectExpression(props);
    return objectExpression;
};
export const makeConstAssign = (constName, asignment = null, t = types) => {
    const declarator = t.variableDeclarator(t.identifier(constName), asignment);
    const constAsignment = t.variableDeclaration('const', [declarator]);
    return constAsignment;
};
export const makeDefaultExport = (name, t = types) => {
    return t.exportDefaultDeclaration(t.identifier(name));
};
export const makeJSSDefaultExport = (componentName, stylesName, t = types) => {
    return t.exportDefaultDeclaration(t.callExpression(t.callExpression(t.identifier('injectSheet'), [t.identifier(stylesName)]), [t.identifier(componentName)]));
};
export const makeProgramBody = (statements = [], t = types) => t.program(statements);
export const makeDefaultImportStatement = (specifier, source, t = types) => {
    return t.importDeclaration([t.importDefaultSpecifier(t.identifier(specifier))], t.stringLiteral(source));
};
export const makeNamedImportStatement = (specifiers, source, t = types) => {
    return t.importDeclaration(specifiers.map((specifier) => t.importSpecifier(t.identifier(specifier), t.identifier(specifier))), t.stringLiteral(source));
};
export const makeNamedMappedImportStatement = (specifiers, source, t = types) => {
    return t.importDeclaration(Object.keys(specifiers).reduce((acc, specifierKey) => {
        acc.push(t.importSpecifier(t.identifier(specifiers[specifierKey]), t.identifier(specifierKey)));
        return acc;
    }, []), t.stringLiteral(source));
};
export const makeGenericImportStatement = (path, imports, t = types) => {
    const defaultImport = imports.find((imp) => !imp.namedImport);
    let importASTs = [];
    if (defaultImport) {
        const namedImports = imports.filter((imp) => imp.identifier !== defaultImport.identifier);
        importASTs = [
            t.importDefaultSpecifier(t.identifier(defaultImport.identifier)),
            ...namedImports.map((imp) => t.importSpecifier(t.identifier(imp.identifier), t.identifier(imp.originalName))),
        ];
    }
    else {
        importASTs = imports.map((imp) => t.importSpecifier(t.identifier(imp.identifier), t.identifier(imp.originalName)));
    }
    return t.importDeclaration(importASTs, t.stringLiteral(path));
};
export const resolveImportStatement = (componentName, dependency) => {
    const details = dependency.meta;
    if (details.namedImport) {
        return details.originalName
            ? makeNamedMappedImportStatement({ [details.originalName]: componentName }, details.path)
            : makeNamedImportStatement([componentName], details.path);
    }
    return makeDefaultImportStatement(componentName, details.path);
};
//# sourceMappingURL=js-ast.js.map