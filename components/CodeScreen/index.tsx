import React from 'react'
import dynamic from 'next/dynamic'
import Prism from 'prismjs'

const CodeEditor = dynamic(import('../CodeEditor'), {
  ssr: false,
})

import {
  createReactComponentGenerator,
  createVueComponentGenerator,
  UIDLTypes,
} from '@teleporthq/teleport-code-generators'
import { ReactComponentStylingFlavors } from '@teleporthq/teleport-code-generators/dist/component-generators/react/react-component'

import authorCardUIDL from '../../inputs/component-author-card.json'
import tabSelectorUIDL from '../../inputs/component-tab-selector.json'
import cardListUIDL from '../../inputs/component-card-list.json'
import newComponentUIDL from '../../inputs/new-component.json'

// import { GeneratorTargetsChooser } from '../GeneratorTargetsChooser'
// import { PannelTitle } from '../PannelTitle'
// import { JsonInputChooser } from '../JsonInputChooser'

const vueGenerator = createVueComponentGenerator()
const reactInlineStylesGenerator = createReactComponentGenerator({
  variation: ReactComponentStylingFlavors.InlineStyles,
})
const reactJSSGenerator = createReactComponentGenerator({
  variation: ReactComponentStylingFlavors.JSS,
})
const reactStyledJSXGenerator = createReactComponentGenerator({
  variation: ReactComponentStylingFlavors.StyledJSX,
})
const reactCSSModulesGenerator = createReactComponentGenerator({
  variation: ReactComponentStylingFlavors.CSSModules,
})

const uidlSamples: Record<string, UIDLTypes.ComponentUIDL> = {
  'author-card': authorCardUIDL,
  'card-list': cardListUIDL,
  'tab-selector': tabSelectorUIDL,
  'new-component': newComponentUIDL,
}

interface CodeScreenState {
  generatedCode: string
  targetLibrary: string
  inputJson: string
  sourceJSON: string
}

const jsonPrettify = (json: UIDLTypes.ComponentUIDL): string => {
  return JSON.stringify(json, null, 2)
}

class CodeScreen extends React.Component<{}, CodeScreenState> {
  constructor(props: {}) {
    super(props)
    this.state = {
      generatedCode: '',
      inputJson: '',
      targetLibrary: 'react.InlineStyles',
      sourceJSON: jsonPrettify(uidlSamples['new-component']),
    }
  }

  public componentDidMount() {
    this.setState({ inputJson: this.state.sourceJSON }, this.handleInputChange)
  }

  public handleJSONUpdate = (inputJson: string) => {
    if (!inputJson) {
      return false
    }

    this.setState({ inputJson, sourceJSON: inputJson }, this.handleInputChange)
  }

  public handleInputChange = async () => {
    const { targetLibrary, inputJson } = this.state
    let jsonValue: any = null

    try {
      jsonValue = JSON.parse(inputJson)
    } catch (err) {
      return
    }

    const generator = chooseGenerator(targetLibrary)

    try {
      const { files } = await generator.generateComponent(jsonValue).catch((e: Error) => {
        // tslint:disable-next-line:no-console
        console.error(e)
        return
      })

      const component = files[0]
      if (!component) {
        // tslint:disable-next-line:no-console
        console.error('no content')
        return
      }
      this.setState({ generatedCode: component.content }, Prism.highlightAll)
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.error('generateReactComponent', err)
    }
  }

  public render() {
    return (
      <div className="main-content">
        {/* <JsonInputChooser
          options={Object.keys(uidlSamples)}
          value={this.state.sourceJSON}
          onChoose={this.handleJSONChoose}
        /> */}
        <div className="editor">
          <CodeEditor
            editorDomId={'json-editor'}
            mode={'json'}
            value={this.state.sourceJSON}
            onChange={this.handleJSONUpdate}
          />
        </div>
        <div className="editor">
          <pre className="code-previewer">
            <code className={`language-jsx`}>{this.state.generatedCode}</code>
          </pre>
          {/* <CodeEditor
            editorDomId={'code-previewer'}
            mode={'jsx'}
            readOnly
            value={this.state.generatedCode}
          /> */}
        </div>
        <style jsx>{`
            .main-content {
              display: flex;
              padding-top 20px;
              padding-bottom 20px;

              width: 100%;
              height: calc(100% - 71px);
              justify-content: space-around;
              box-sizing: border-box;
            }

            .editor {
              border-radius: 10px;
              width: 48%;
              background: var(--editor-bg-black);
              overflow: hidden;
              z-index: 3;
            }

            .code-previewer {
              height: 100%;
            }
          `}</style>
      </div>
    )
  }
}

export { CodeScreen }

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
