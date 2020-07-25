import Document, { Html, Head, Main, NextScript } from 'next/document'

const DEFAULT_DESCRIPTION =
  'Tool for iterating over the JSON schema of components for the teleporthq ecosystem.'
const DEFAULT_KEYWORDS = 'teleportHQ REPL'

export default class MyDocument extends Document {
  public render() {
    return (
      <Html lang="en">
        <Head>
          <base href="/" />

          <meta charSet="utf-8" />
          <meta httpEquiv="Content-type" content="text/html;charset=UTF-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
          <meta
            name="viewport"
            content="width=device-width,initial-scale=1,maximum-scale=1"
          />

          <meta name="description" content={DEFAULT_DESCRIPTION} />
          <meta name="keywords" content={DEFAULT_KEYWORDS} />
          <link rel="icon" href="static/favicon.ico" type="image/ico" />
          <link rel="shortcut icon" href="static/favicon.ico" type="image/x-icon" />
          <link
            href="https://fonts.googleapis.com/css?family=Roboto:400,700&display=swap"
            rel="stylesheet"
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-5HFFGVX');`,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
