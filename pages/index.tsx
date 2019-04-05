import React from 'react'
import dynamic from 'next/dynamic'

import { AppPage } from '../components/AppPage'
import { TopBar } from '../components/TopBar'
import { GeneratorTargetsChooser } from '../components/GeneratorTargetsChooser'
import { PannelTitle } from '../components/PannelTitle'
import { JsonInputChooser } from '../components/JsonInputChooser'

import {
  UIDLValidators,
  UIDLTypes,
  GeneratorTypes,
  createReactComponentGenerator,
  createVueComponentGenerator,
} from '@teleporthq/teleport-code-generators'

import authorCardUIDL from '../inputs/component-author-card.json'
import tabSelectorUIDL from '../inputs/component-tab-selector.json'
import cardListUIDL from '../inputs/component-card-list.json'

const CodeEditor = dynamic(import('../components/CodeEditor'), {
  ssr: false,
})

const uidlSamples: Record<string, UIDLTypes.ComponentUIDL> = {
  'author-card': authorCardUIDL,
  'card-list': cardListUIDL,
  'tab-selector': tabSelectorUIDL,
}

const {
  InlineStyles,
  JSS,
  StyledJSX,
  CSSModules,
} = GeneratorTypes.ReactComponentStylingFlavors

const vueGenerator = createVueComponentGenerator()
const reactInlineStylesGenerator = createReactComponentGenerator({
  variation: InlineStyles,
})
const reactJSSGenerator = createReactComponentGenerator({ variation: JSS })
const reactStyledJSXGenerator = createReactComponentGenerator({ variation: StyledJSX })
const reactCSSModulesGenerator = createReactComponentGenerator({ variation: CSSModules })

// TODO move into utils file
const postData = (url: string = ``, data: string = ``) => {
  // Default options are marked with *
  return (
    fetch(url, {
      body: data, // body data type must match "Content-Type" header
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, cors, *same-origin
      redirect: 'follow', // manual, *follow, error
      referrer: 'no-referrer', // no-referrer, *client
    })
      .then((response) => response.json())
      // tslint:disable-next-line:no-console
      .catch((err) => console.error(err))
  ) // parses response to JSON
}
interface PlaygroundPageState {
  generatedCode: string
  targetLibrary: string
  inputJson: string
  sourceJSON: string
}

export default class PlaygroundPage extends React.Component<{}, PlaygroundPageState> {
  public state: PlaygroundPageState = {
    generatedCode: '',
    inputJson: '',
    targetLibrary: 'react.InlineStyles',
    sourceJSON: 'author-card.json',
  }

  // public codeEditorRef = React.createRef<MonacoEditor>()

  public handleGeneratorTypeChange = (ev: { target: { value: string } }) => {
    this.setState({ targetLibrary: ev.target.value }, this.handleInputChange)
  }

  // public handleJSONUpdate = (updateEvent: MonacoUpdateEventPackage) => {
  //   if (!updateEvent.value) {
  //     return false
  //   }

  //   this.setState({ inputJson: updateEvent.value }, this.handleInputChange)
  // }

  public handleInputChange = async () => {
    const { targetLibrary, inputJson } = this.state
    let jsonValue: any = null

    try {
      jsonValue = JSON.parse(inputJson)
    } catch (err) {
      return
    }

    const validationResult = UIDLValidators.validateComponent(jsonValue)
    if (validationResult !== true) {
      // tslint:disable-next-line:no-console
      console.error(validationResult)
      return
    }

    try {
      const generator = chooseGenerator(targetLibrary)
      const { code, dependencies } = await generator.generateComponent(jsonValue)

      // tslint:disable-next-line:no-console
      console.info('output dependencies: ', dependencies)
      this.setState({
        generatedCode: code.toString(),
      })
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.error('generateReactComponent', err)
    }
  }

  // public handleJSONChoose = (ev: { target: { value: string } }) => {
  //   const newValue = ev.target.value
  //   const uidl = uidlSamples[newValue]

  //   if (this.codeEditorRef && this.codeEditorRef.current) {
  //     this.codeEditorRef.current.setValue(JSON.stringify(uidl, null, 2))
  //     this.setState({ sourceJSON: newValue })
  //   }
  // }

  public render() {
    return (
      <AppPage>
        <TopBar />
        <div className="main-content">
          <div className="editor">
            <CodeEditor />
          </div>
          <div className="editor">
            <CodeEditor />
          </div>
        </div>
        <style jsx>{`
          .main-content {
            display: flex;
            padding: 20px;
            width: 100%;
            height: 100%;
            justify-content: space-around;
          }

          .editor {
            border-radius: 10px;
            width: 45%;
            height: 80%;
            background: red;
            overflow: hidden;
          }
        `}</style>
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

            <CodeEditor />
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

const chooseGenerator = (flavor: string) => {
  switch (flavor) {
    case 'react.InlineStyles':
      return reactInlineStylesGenerator
    case 'react.StyledJSX':
      return reactStyledJSXGenerator
    case 'react.JSS':
      return reactJSSGenerator
    case 'react.CSSModules':
      return reactCSSModulesGenerator
    case 'vue':
      return vueGenerator
    default:
      return reactInlineStylesGenerator
  }
}
