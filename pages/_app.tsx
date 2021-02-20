import React from 'react'
import App from 'next/app'
import Head from 'next/head'

const DEFAULT_TITLE = 'teleportHQ REPL'

class MyApp extends App {
  public render() {
    const { Component, pageProps } = this.props
    return (
      <>
        <Head>
          <title>{DEFAULT_TITLE}</title>
          <style>{`.sp-stack { height: auto !important}`}</style>
        </Head>
        <Component {...pageProps} />
      </>
    )
  }
}

export default MyApp
