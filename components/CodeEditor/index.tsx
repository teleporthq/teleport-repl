import React from 'react'

import AceEditor from 'react-ace'
import 'brace/mode/html'
import 'brace/mode/jsx'
import 'brace/mode/json'
import 'brace/mode/javascript'

import 'brace/theme/monokai'

interface EditorProps {
  mode: 'jsx' | 'json' | 'javascript' | 'html'
  editorDomId: string
  onChange: (value: string) => void
  value?: string
  readOnly?: boolean
}

class CodeEditor extends React.Component<EditorProps, {}> {
  public editor: any

  constructor(props: EditorProps) {
    super(props)
    this.editor = undefined
  }

  public onChange = (newValue: string) => {
    this.props.onChange(newValue)
  }

  public render() {
    const { mode, editorDomId, readOnly, value } = this.props
    return (
      <AceEditor
        mode={mode}
        theme="monokai"
        onChange={this.onChange}
        name={editorDomId}
        editorProps={{ $blockScrolling: true }}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        setOptions={{ readOnly: readOnly || false }}
        value={value || ''}
      />
    )
  }
}

export default CodeEditor
