import React from 'react'
import dynamic from 'next/dynamic'
import { withRouter } from 'next/router'
import Prism from 'prismjs'

import {
  createReactComponentGenerator,
  createVueComponentGenerator,
  UIDLTypes,
  GeneratorTypes,
} from '@teleporthq/teleport-code-generators'
import { ReactComponentStylingFlavors } from '@teleporthq/teleport-code-generators/dist/component-generators/react/react-component'

import newComponentUIDL from '../../inputs/new-component.json'
import oneComponentUIDL from '../../inputs/one-component.json'
import modalWindowUIDL from '../../inputs/modal-window.json'
import modalUIDL from '../../inputs/modal.json'
import expandableArealUIDL from '../../inputs/expandable-area.json'

const CodeEditor = dynamic(import('../CodeEditor'), {
  ssr: false,
})

import { DropDown } from '../DropDown'
import { Tabs } from '../Tabs'
import { ErrorPanel } from '../ErrorPanel'

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
  'new-component': newComponentUIDL,
  'one-component': oneComponentUIDL,
  'modal-window': modalWindowUIDL,
  modal: modalUIDL,
  'expandable-area': expandableArealUIDL,
}

interface CodeScreenState {
  generatedCode: string
  targetLibrary: string
  inputJson: string
  sourceJSON: string
  libraryFlavor: string
  externalLink: boolean
  showErrorPanel: boolean
  error: any
}

interface CodeProps {
  router: any
}

class Code extends React.Component<CodeProps, CodeScreenState> {
  constructor(props: CodeProps) {
    super(props)
    this.state = {
      generatedCode: '',
      sourceJSON: 'new-component',
      inputJson: jsonPrettify(uidlSamples['new-component']),
      targetLibrary: 'react',
      libraryFlavor: 'StyledJSX',
      externalLink: false,
      showErrorPanel: false,
      error: null,
    }
  }

  public componentDidMount() {
    this.initREPL()
  }

  public initREPL = async () => {
    const linkLoaded = await this.checkForExternalJSON()
    if (linkLoaded) {
      return
    }

    this.handleInputChange()
  }

  public checkForExternalJSON = async () => {
    const {
      router: { query },
    } = this.props

    const { uidlLink } = query
    if (!uidlLink) {
      return false
    }

    return this.fetchJSONDataAndLoad(uidlLink)
  }

  public fetchJSONDataAndLoad = async (uidlLink: string) => {
    const result = await fetch(uidlLink)
    try {
      if (result.status !== 200) throw new Error(result.statusText)

      const jsonData = await result.json()
      this.setState(
        {
          inputJson: jsonPrettify(jsonData),
          externalLink: true,
          sourceJSON: 'externalLink',
          showErrorPanel: false,
          error: null,
        },
        this.handleInputChange
      )

      return true
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.error('Cannot fetch UIDL', error)
      return false
    }
  }

  public handleJSONUpdate = (inputJson: string) => {
    if (!inputJson) {
      return false
    }

    this.setState(
      { inputJson, showErrorPanel: false, error: null },
      this.handleInputChange
    )
  }

  public handleInputChange = async () => {
    const { targetLibrary, inputJson, libraryFlavor } = this.state
    let jsonValue: any = null

    try {
      jsonValue = JSON.parse(inputJson)
    } catch (err) {
      return
    }

    const generatorSelectorString =
      libraryFlavor.length > 0 ? `${targetLibrary}.${libraryFlavor}` : targetLibrary
    const generator = chooseGenerator(generatorSelectorString)

    try {
      const result: GeneratorTypes.CompiledComponent = await generator.generateComponent(
        jsonValue
      )

      const component = result.files[0]
      if (!component) {
        // tslint:disable-next-line:no-console
        console.log('no content')
        return
      }
      this.setState({ generatedCode: component.content }, Prism.highlightAll)
    } catch (err) {
      this.setState({ generatedCode: '', showErrorPanel: true, error: err })
      // tslint:disable-next-line:no-console
      console.error('generateReactComponent', err)
    }
  }

  public handleSourceChange = (source: { target: { value: string } }): void => {
    const {
      target: { value },
    } = source

    if (value === 'externalLink') {
      this.checkForExternalJSON()
      return
    }

    const sourceJSON = jsonPrettify(uidlSamples[value])
    this.setState(
      { inputJson: sourceJSON, sourceJSON: value, showErrorPanel: false, error: null },
      this.handleInputChange
    )
  }

  public handleTargetChange = (target: string) => {
    const libraryFlavor = target === 'react' ? 'StyledJSX' : ''
    this.setState({ targetLibrary: target, libraryFlavor }, this.handleInputChange)
  }

  public handleFlavourChange = (flavor: { target: { value: string } }) => {
    const {
      target: { value },
    } = flavor

    this.setState({ libraryFlavor: value }, this.handleInputChange)
  }

  public renderDropDownFlavour = () => {
    const { targetLibrary } = this.state
    if (targetLibrary !== 'react') {
      return null
    }

    return (
      <DropDown
        list={Object.values(ReactComponentStylingFlavors)}
        onChoose={this.handleFlavourChange}
        value={this.state.libraryFlavor}
      />
    )
  }

  public getSamplesName = () => {
    const samples = Object.keys(uidlSamples)
    const { externalLink } = this.state
    if (externalLink) {
      samples.push('externalLink')
    }

    return samples
  }

  public render() {
    return (
      <div className="main-content">
        <div className="editor">
          <div className="editor-header with-offset">
            <DropDown
              list={this.getSamplesName()}
              onChoose={this.handleSourceChange}
              value={this.state.sourceJSON}
            />
          </div>
          <div className="code-wrapper">
            <CodeEditor
              editorDomId={'json-editor'}
              mode={'json'}
              value={this.state.inputJson}
              onChange={this.handleJSONUpdate}
            />
          </div>
          <ErrorPanel error={this.state.error} visible={this.state.showErrorPanel} />
        </div>
        <div className="editor">
          <div className="editor-header previewer-header">
            <Tabs
              options={generators}
              selected={this.state.targetLibrary}
              onChoose={this.handleTargetChange}
            />
            {this.renderDropDownFlavour()}
          </div>
          <div className="code-wrapper">
            <pre>
              <code className={`language-jsx`}>{this.state.generatedCode}</code>
            </pre>
          </div>
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
              width: 49%;
              background: var(--editor-bg-black);
              overflow: hidden;
              z-index: 3;
              padding: 0 0 30px 0;
              position: relative
            }

            .editor-header {
              height: 30px;
              display: flex;
              flex-direction: row;
              border-bottom: solid 1px #cccccc20;
              padding: 10px 10px;
            }

            .code-wrapper {
              height: calc(100% - 30px);
              overflow: auto;

            }

            .code-wrapper::-webkit-scrollbar {
              width: 10px;
            }
            .code-wrapper::-webkit-scrollbar-thumb {
              background: var(--editor-scrollbar-color);
              border-radius: 5px;
            }

            .code-wrapper pre::-webkit-scrollbar {
              width: 10px;
              height: 10px;
            }

            .code-wrapper pre::-webkit-scrollbar-thumb {
              background: var(--editor-scrollbar-color);
              border-radius: 5px;
            }

            .previewer-header {
              justify-content: space-between;
              align-items: center;
            }

            .previewer-header .code-wrapper {
              background-color: #2d2d2d;
            }

            .with-offset {
              padding-left: 50px;
            }
          `}</style>
      </div>
    )
  }
}

const CodeScreen = withRouter(Code)
export { CodeScreen }

const jsonPrettify = (json: UIDLTypes.ComponentUIDL): string => {
  return JSON.stringify(json, null, 2)
}

const generators = ['react', 'vue']
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
