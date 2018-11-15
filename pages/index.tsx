import React from 'react'

import { AppPage } from '../components/AppPage'
import { MonacoEditor, MonacoUpdateEventPackage } from '../components/MonacoEditor'
import { GeneratorTargetsChooser } from '../components/GeneratorTargetsChooser'
import { PannelTitle } from '../components/PannelTitle'
import { PreviewFrame } from '../components/PreviewFrame'

import loadWrapper from '../utils/teleportWrapper'
import uildValidator from '../utils/uildValidator'

// TODO move into utils file
const postData = (url: string = ``, data: string = ``) => {
  // Default options are marked with *
  return fetch(url, {
    body: data, // body data type must match "Content-Type" header
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer', // no-referrer, *client
  }).then((response) => response.json()) // parses response to JSON
}
interface PlaygroundPageState {
  generatedCode: string
  targetLibrary: string
  inputJson: string
}

export default class PlaygroundPage extends React.Component<{}, PlaygroundPageState> {
  public state: PlaygroundPageState = {
    generatedCode: '',
    inputJson: '',
    targetLibrary: 'react',
  }

  public handleGeneratorTypeChange = (ev: { target: { value: string } }) => {
    this.setState({ targetLibrary: ev.target.value }, this.handleInputChange)
  }

  public handleJSONUpdate = (updateEvent: MonacoUpdateEventPackage) => {
    if (!updateEvent.value) {
      return false
    }

    this.setState({ inputJson: updateEvent.value }, this.handleInputChange)
  }

  public handleInputChange = () => {
    const { targetLibrary, inputJson } = this.state
    let jsonValue: any = null
    try {
      jsonValue = JSON.parse(inputJson)
    } catch (err) {
      return
    }

    const validationResult = uildValidator(jsonValue)
    if (validationResult !== true) {
      // tslint:disable-next-line:no-console
      console.error(validationResult)
      return
    }

    loadWrapper().then((wrapper) => {
      const result = wrapper.generateComponent(jsonValue, targetLibrary)
      const fileName = result.getFileNames()[0]

      const generatedCode = result.getContent(fileName)

      if (!generatedCode) {
        return
      }

      this.setState(
        {
          generatedCode,
        },
        () => {
          postData(this.getPreviewerUrl() + '/preview', generatedCode)
        }
      )
    })
  }

  public getPreviewerUrl() {
    return this.state.targetLibrary === 'react' ? 'http://localhost:3031' : 'http://localhost:3032'
  }

  public render() {
    return (
      <AppPage>
        <div className="main-content">
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
              flex: 1;
            }

            .json-input-container {
              flex: 1;
            }

            .generators-target-type {
              background-color: #1e1e1e;
              padding: 8px;
            }
          `}</style>

          <div className="json-input-container">
            <PannelTitle>Input json here</PannelTitle>
            <MonacoEditor
              name="json-editor"
              value={`{
  "name": "TestComponent",
  "version": "v1",
  "content": {
    "type": "View",
    "source": "teleport-elements-core",
    "name" : "View", 
    "style" : {
        "width" : "100%", 
        "height" : "100%", 
        "flexDirection" : "row", 
        "backgroundColor" : "#822CEC",
        "color": "#FFF"
    },
    "children": "Hello Teleport World!"
  }
}`}
              onMessage={this.handleJSONUpdate}
            />
          </div>

          <div className="results-container">
            <div className="generators-target-type">
              <GeneratorTargetsChooser onChoose={this.handleGeneratorTypeChange} value={this.state.targetLibrary} />
              <button>Refresh All</button>
              <button>Refresh Code</button>
              <button>Refresh Project</button>
            </div>
            <PannelTitle>Running app with generated code</PannelTitle>
            <div className="live-view-container">
              <PreviewFrame url={this.getPreviewerUrl()} />
            </div>
            <div className="code-view-container">
              <PannelTitle>Generated code</PannelTitle>
              <MonacoEditor name="code-preview" language="javascript" value={this.state.generatedCode} readOnly />
            </div>
          </div>
        </div>
      </AppPage>
    )
  }
}
