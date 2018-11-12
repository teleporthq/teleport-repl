/* tslint:disable */
// (vlad) This file is to hacky to be linted properly, it's taken form teleport-development-playground

import React from 'react'
import throttle from 'lodash.throttle'

interface MonacoEditorProps {
  name: string

  readOnly?: boolean
  language?: string
  value?: string
  onMessage?: (params:MonacoUpdateEventPackage) => any
}

interface MonacoEditorState {
  value: string
}

export interface MonacoUpdateEventPackage {
  event: any,
  value: string
}

export class MonacoEditor extends React.Component<MonacoEditorProps, MonacoEditorState> {
  public static defaultProps = {
    language: 'json',
    onMessage: (args:MonacoUpdateEventPackage) => console['log']('default onMessage', args),
    readOnly: false,
    value: '',
  }

  iframe: HTMLIFrameElement | null = null
  value: string | null = null

  componentWillReceiveProps(props: MonacoEditorProps) {
    const { value } = props
    if (value === this.value) {
      return
    }
    this.sendMessage({ type: 'setValue', value: value + '' })
  }

  componentDidMount() {
    if (!window['editors']) {
      window['editors'] = {}
    }

    window['editors'][this.props.name] = {
      editor: this,
      post: throttle(this.handleOnMessageReaction, 2000),
    }
    this.init()
  }

  init = () => {
    const { name, value, language, readOnly } = this.props
    this.value = value
    this.sendMessage({ type: 'setName', value: name })
    this.sendMessage({ type: 'setValue', value: value })
    this.sendMessage({ type: 'setLanguage', value: language })
    this.sendMessage({ type: 'setReadOnly', value: readOnly })
  }

  sendMessage = (message: any) => {
    // console.log('send message', message, window.location.href)
    this.iframe.contentWindow.postMessage(message, window.location.href)
  }

  handleOnMessageReaction = (args: any) => {
    this.props.onMessage(args)
  }

  render() {
    return (
      <iframe ref={(iframe: HTMLIFrameElement) => (this.iframe = iframe)} scrolling="no" src="/static/editor/index.html">
        <style jsx>{`
          iframe {
            height: 100%;
            width: 100%;
            border: none;
          }
        `}</style>
      </iframe>
    )
  }
}
