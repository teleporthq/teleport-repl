import React from 'react'

import { AppPage } from '../components/AppPage'
import { TopBar } from '../components/TopBar'
import { CodeScreen } from '../components/CodeScreen'

interface PlaygroundPageState {
  generatedCode: string
  targetLibrary: string
  inputJson: string
  sourceJSON: string
}

export default class PlaygroundPage extends React.Component<{}, PlaygroundPageState> {
  public render() {
    return (
      <AppPage>
        <TopBar />
        <CodeScreen />
      </AppPage>
    )

    return (
      <AppPage>
        <div className="main-content">
          <div className="json-input-container">
            <PannelTitle>
              Input json:
              <JsonInputChooser
                options={Object.keys(uidlSamples)}
                value={this.state.sourceJSON}
                onChoose={this.handleJSONChoose}
              />
            </PannelTitle>

            {/* <ReactSimpleEditor /> */}
            {/* <SyntaxHighlighter ref={this.codeEditorRef} language="json">
              {}
            </SyntaxHighlighter> */}
            {/* <MonacoEditor
              ref={this.codeEditorRef}
              name="json-editor"
              value={JSON.stringify(authorCardUIDL, null, 2)}
              onMessage={this.handleJSONUpdate}
            /> */}
          </div>

          <div className="results-container">
            <div className="generators-target-type">
              <GeneratorTargetsChooser
                onChoose={this.handleGeneratorTypeChange}
                value={this.state.targetLibrary}
              />
            </div>
            <div className="code-view-container">
              <PannelTitle>Generated code</PannelTitle>

              {/* <MonacoEditor
                name="code-preview"
                language="javascript"
                value={this.state.generatedCode}
                readOnly
              /> */}
            </div>
          </div>
        </div>
        <style jsx>{`
          .main-content {
            display: flex;
            width: 100%;
            height: 100%;
          }

          .results-container {
            display: flex;
            flex-flow: column;
            flex: 1;
          }

          .live-view-container {
            flex: 1;
          }

          .code-view-container {
            flex: 2;
          }

          .json-input-container {
            flex: 1;
          }

          .generators-target-type {
            background-color: #1e1e1e;
            padding: 8px;
          }
        `}</style>
      </AppPage>
    )
  }
}
