import Document, { Head, Main, NextScript } from 'next/document';

const DEFAULT_TITLE = 'Teleport Component Playground'
const DEFAULT_DESCRIPTION = 'Teleport Component Playground'
const DEFAULT_KEYWORDS = 'Teleport Component Playground'

class StorePageDocument extends Document {

  public renderHeader () {
    return(
      <Head>

        <base href="/" />
        <title>{DEFAULT_TITLE}</title>

        {/*  <!-- General Meta Tags --> */}
        <meta charSet="utf-8" />
        <meta httpEquiv="Content-type" content="text/html;charset=UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />

        <meta name="description" content={DEFAULT_DESCRIPTION}/>
        <meta name="keywords" content={DEFAULT_KEYWORDS} />
        {/*  <!-- End General Meta Tags --> */}

        {/* <!-- Font from google. Used in AppPage component --> */}
        <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet"></link>
      </Head>
    );
  }

  public render() {
    return (
      <html>
        {this.renderHeader()}
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}

export default StorePageDocument;
