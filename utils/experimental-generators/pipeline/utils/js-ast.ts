import * as types from '@babel/types'

/**
 * A tricky way to pass down custom configuration into
 * the objectToObjectExpression values, to allow for member expressions like
 * Proptypes.String.isRequired to be handled by the function.
 */
export class ParsedASTNode {
  public ast: any

  constructor(ast: any) {
    this.ast = ast
  }
}

export const objectToObjectExpression = (
  objectMap: { [key: string]: any },
  t = types
) => {
  const props = Object.keys(objectMap).reduce((acc: any[], key) => {
    const keyIdentifier = t.stringLiteral(key)
    const value = objectMap[key]
    let computedLiteralValue = null

    if (value instanceof ParsedASTNode) {
      computedLiteralValue = value.ast
    } else if (typeof value === 'string') {
      computedLiteralValue = t.stringLiteral(value)
    } else if (typeof value === 'number') {
      computedLiteralValue = t.numericLiteral(value)
    } else if (typeof value === 'object') {
      computedLiteralValue = objectToObjectExpression(value, t)
    } else if (value === String) {
      computedLiteralValue = t.identifier('String')
    } else if (value === Number) {
      computedLiteralValue = t.identifier('Number')
    }

    if (computedLiteralValue) {
      acc.push(t.objectProperty(keyIdentifier, computedLiteralValue))
    }
    return acc
  }, [])

  const objectExpression = t.objectExpression(props)
  return objectExpression
}

export const makeConstAssign = (constName: string, asignment = null, t = types) => {
  const declarator = t.variableDeclarator(t.identifier(constName), asignment)
  const constAsignment = t.variableDeclaration('const', [declarator])
  return constAsignment
}

export const makeDefaultExport = (name: string, t = types) => {
  return t.exportDefaultDeclaration(t.identifier(name))
}

export const makeJSSDefaultExport = (
  componentName: string,
  stylesName: string,
  t = types
) => {
  return t.exportDefaultDeclaration(
    t.callExpression(
      t.callExpression(t.identifier('injectSheet'), [t.identifier(stylesName)]),
      [t.identifier(componentName)]
    )
  )
}

export const makeProgramBody = (statements: any[] = [], t = types) =>
  t.program(statements)

export const makeDefaultImportStatement = (
  specifier: string,
  source: string,
  t = types
) => {
  return t.importDeclaration(
    [t.importDefaultSpecifier(t.identifier(specifier))],
    t.stringLiteral(source)
  )
}

export const makeNamedImportStatement = (
  specifiers: string[],
  source: string,
  t = types
) => {
  return t.importDeclaration(
    specifiers.map((specifier) =>
      t.importSpecifier(t.identifier(specifier), t.identifier(specifier))
    ),
    t.stringLiteral(source)
  )
}

/**
 * You pass in a object like { 'a': 'b', 'foo': 'bar' } and get back a AST statement
 * like "import { a as b, foo as bar } from '...'"
 *
 * @param specifiers
 * @param source
 * @param t
 */
export const makeNamedMappedImportStatement = (
  specifiers: { [key: string]: string },
  source: string,
  t = types
) => {
  return t.importDeclaration(
    Object.keys(specifiers).reduce((acc: any[], specifierKey: string) => {
      acc.push(
        t.importSpecifier(
          t.identifier(specifiers[specifierKey]),
          t.identifier(specifierKey)
        )
      )
      return acc
    }, []),
    t.stringLiteral(source)
  )
}

/**
 * Generatate a js import statement based a standard UIDL dependency
 */
export const resolveImportStatement = (componentName: string, dependency: any) => {
  const details =
    dependency.meta && dependency.meta.path
      ? dependency.meta
      : {
          // default meta, this will probably change later
          path: './' + componentName,
        }

  if (details.namedImport) {
    // if the component is listed under a different originalName, then import is "x as y"
    return details.originalName
      ? makeNamedMappedImportStatement(
          { [details.originalName]: componentName },
          details.path
        )
      : makeNamedImportStatement([componentName], details.path)
  }

  return makeDefaultImportStatement(componentName, details.path)
}
