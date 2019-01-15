import cheerio from 'cheerio'

export const createXMLNode = (
  tagName: string,
  options = { selfClosing: false }
): Cheerio => {
  const emptyDeclaration = options.selfClosing
    ? `<${tagName}/>`
    : `<${tagName}> </${tagName}>`
  let result

  try {
    result = cheerio.load(emptyDeclaration, {
      xmlMode: true, // otherwise the .html returns a <html><body> thing
      decodeEntities: false, // otherwise we can't set objects like `{ 'text-danger': hasError }`
      // without having them escaped with &quote; and stuff
    })
  } catch (err) {
    result = cheerio.load(`<${tagName}> </${tagName}>`, {
      xmlMode: true, // otherwise the .html returns a <html><body> thing
      decodeEntities: false, // otherwise we can't set objects like `{ 'text-danger': hasError }`
      // without having them escaped with &quote; and stuff
    })
  }

  return result(tagName)
}
