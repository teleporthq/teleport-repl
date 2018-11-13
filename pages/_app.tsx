import App, { Container } from 'next/app'
import Head from 'next/head'
import React from 'react'

const DEFAULT_TITLE = 'Teleport Component Playground'
const DEFAULT_DESCRIPTION = 'Teleport Component Playground'
const DEFAULT_KEYWORDS = 'Teleport Component Playground'

export default class MyApp extends App {
  public static async getInitialProps({ Component, ctx }) {
    let pageProps = {}

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    return { pageProps }
  }

  public render() {
    const { Component, pageProps } = this.props
    return (
      <Container>
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

          <meta name="description" content={DEFAULT_DESCRIPTION} />
          <meta name="keywords" content={DEFAULT_KEYWORDS} />
          {/*  <!-- End General Meta Tags --> */}

          {/* <!-- Font from google. Used in AppPage component --> */}
          <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet" />
        </Head>
        <Component {...pageProps} />
      </Container>
    )
  }
}
