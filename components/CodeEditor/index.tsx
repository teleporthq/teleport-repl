import React from 'react'

import AceEditor from 'react-ace'
import 'brace/mode/json'
import 'brace/theme/monokai'
import 'brace/ext/searchbox'

interface EditorProps {
  mode: 'jsx' | 'json' | 'javascript' | 'html'
  editorDomId: string
  onChange: (value: string) => void
  value?: string
  readOnly?: boolean
  focus?: boolean
  fontSize?: number
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
    const { mode, editorDomId, readOnly, value, focus, fontSize } = this.props
    return (
      <AceEditor
        mode={mode}
        theme="monokai"
        onChange={this.onChange}
        name={editorDomId}
        editorProps={{ $blockScrolling: true }}
        style={{
          width: '100%',
          height: '100%',
          zIndex: 1,
          fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
        }}
        setOptions={{ readOnly: readOnly || false }}
        value={value || ''}
        focus={focus || false}
        fontSize={fontSize || 14}
        tabSize={2}
        showPrintMargin={false}
      />
    )
  }
}

export default CodeEditor
