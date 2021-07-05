import React from 'react'
import App from 'next/app'
import Head from 'next/head'
import '@codesandbox/sandpack-react/dist/index.css'

const DEFAULT_TITLE = 'teleportHQ REPL'

class MyApp extends App {
  public render() {
    const { Component, pageProps } = this.props
    return (
      <>
        <Head>
          <title>{DEFAULT_TITLE}</title>
          <meta
            name="viewport"
            content="width=device-width,initial-scale=1,maximum-scale=1"
          />
        </Head>
        <Component {...pageProps} />
      </>
    )
  }
}

export default MyApp
