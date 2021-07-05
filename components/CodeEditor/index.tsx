import React from 'react'

import AceEditor from 'react-ace'
import 'brace/mode/json'
import 'brace/theme/monokai'
import 'brace/ext/searchbox'

interface EditorProps {
  mode: 'jsx' | 'json' | 'javascript' | 'html'
  editorDomId: string
  onChange?: (value: string) => void
  value?: string
  readOnly?: boolean
  focus?: boolean
  fontSize?: number
}

class CodeEditor extends React.Component<EditorProps, {}> {
  editorRef = React.createRef<AceEditor>()
  constructor(props: EditorProps) {
    super(props)
  }

  componentDidUpdate(prevProps: EditorProps) {
    if (
      JSON.stringify(prevProps?.value) !== JSON.stringify(this.props?.value) &&
      this.props?.value
    ) {
      this.editorRef.current?.editor?.setValue(this.props.value as string, -1)
    }
  }

  public onChange = (newValue: string) => {
    if (this.props.onChange) {
      this.props.onChange(newValue)
    }
  }

  public render() {
    const { mode, editorDomId, readOnly, value, focus, fontSize } = this.props
    return (
      <AceEditor
        ref={this.editorRef}
        defaultValue={value || ''}
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
        focus={focus || false}
        fontSize={fontSize || 14}
        tabSize={2}
        showPrintMargin={false}
      />
    )
  }
}

export default CodeEditor
