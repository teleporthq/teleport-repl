import Document, { Main, NextScript } from 'next/document'

class StorePageDocument extends Document {
  public render() {
    return (
      <html>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}

export default StorePageDocument
