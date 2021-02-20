import React from 'react'
import App from 'next/app'
import Head from 'next/head'
import 'react-smooshpack/dist/index.css'

const DEFAULT_TITLE = 'teleportHQ REPL'

class MyApp extends App {
  public render() {
    const { Component, pageProps } = this.props
    return (
      <>
        <Head>
          <title>{DEFAULT_TITLE}</title>
        </Head>
        <Component {...pageProps} />
      </>
    )
  }
}

export default MyApp
