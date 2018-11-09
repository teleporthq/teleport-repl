import React from 'react'

interface ErrorProps {
  statusCode: string
}

export default class Error extends React.Component<ErrorProps> {
  public static getInitialProps(params: { res: any; err: any }) {
    const { res, err } = params
    const statusCode = res ? res.statusCode : err ? err.statusCode : null
    return { statusCode }
  }

  public render() {
    return <p>{this.props.statusCode ? `An error ${this.props.statusCode} occurred on server` : 'An error occurred on client'}</p>
  }
}
