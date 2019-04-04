import React from 'react'

import AceEditor from 'react-ace'
import 'brace/mode/jsx'
import 'brace/mode/json'
import 'brace/mode/javascript'

import 'brace/theme/monokai'

class CodeEditor extends React.Component<{}, {}> {
  public editor: any

  constructor(props: {}) {
    super(props)
    this.editor = undefined
  }

  public onChange = (newValue: string, e: any) => {
    // const editor = this.editor
  }

  public render() {
    return (
      <AceEditor
        mode="jsx"
        theme="monokai"
        onChange={this.onChange}
        name="UNIQUE_ID_OF_DIV"
        editorProps={{ $blockScrolling: true }}
      />
    )
  }
}
export default CodeEditor
