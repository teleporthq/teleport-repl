import cheerio from 'cheerio'

export interface VueTagParams {
  tagName?: string
}

const defaultProps: Partial<VueTagParams> = {
  tagName: 'div',
}

const generateXMLTag = (c: CheerioAPI, params: { tagName: string }) => {
  return c.load(`<${params.tagName}> </${params.tagName}>`, {
    xmlMode: true, // otherwise the .html returns a <html><body> thing
    decodeEntities: false, // otherwise we can't set objects like `{ 'text-danger': hasError }`
    // without having them escaped with &quote; and stuff
  })
}

export class VueTag {
  public node: CheerioStatic

  constructor(tagName: string = 'div', params?: VueTagParams) {
    const instanceOptions = {
      ...defaultProps,
      ...params,
      tagName,
    }
    this.node = generateXMLTag(cheerio, instanceOptions)
  }
}
