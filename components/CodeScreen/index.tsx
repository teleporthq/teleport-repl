import React from 'react'
import dynamic from 'next/dynamic'

const CodeEditor = dynamic(import('../CodeEditor'), {
  ssr: false,
})

import {
  UIDLValidators,
  UIDLTypes,
  GeneratorTypes,
  createReactComponentGenerator,
  createVueComponentGenerator,
} from '@teleporthq/teleport-code-generators'

import authorCardUIDL from '../../inputs/component-author-card.json'
import tabSelectorUIDL from '../../inputs/component-tab-selector.json'
import cardListUIDL from '../../inputs/component-card-list.json'

import { GeneratorTargetsChooser } from '../GeneratorTargetsChooser'
import { PannelTitle } from '../PannelTitle'
import { JsonInputChooser } from '../JsonInputChooser'

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

const uidlSamples: Record<string, UIDLTypes.ComponentUIDL> = {
  'author-card': authorCardUIDL,
  'card-list': cardListUIDL,
  'tab-selector': tabSelectorUIDL,
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
      sourceJSON: jsonPrettify(uidlSamples['card-list']),
    }
  }

  public componentDidMount() {
    this.setState({ inputJson: this.state.sourceJSON }, this.handleInputChange)
  }

  // public handleGeneratorTypeChange = (ev: { target: { value: string } }) => {
  //   this.setState({ targetLibrary: ev.target.value }, this.handleInputChange)
  // }

  // public handleJSONUpdate = (updateEvent: MonacoUpdateEventPackage) => {
  //   if (!updateEvent.value) {
  //     return false
  //   }

  //   this.setState({ inputJson: updateEvent.value }, this.handleInputChange)
  // }

  // public handleJSONChoose = (ev: { target: { value: string } }) => {
  //   const newValue = ev.target.value
  //   const uidl = uidlSamples[newValue]

  //   if (this.codeEditorRef && this.codeEditorRef.current) {
  //     this.codeEditorRef.current.setValue(JSON.stringify(uidl, null, 2))
  //     this.setState({ sourceJSON: newValue })
  //   }
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
          />
        </div>
        <div className="editor">
          <CodeEditor
            editorDomId={'code-previewer'}
            mode={'javascript'}
            readOnly
            value={this.state.generatedCode}
          />
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
