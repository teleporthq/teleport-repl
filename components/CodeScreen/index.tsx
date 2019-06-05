import React from 'react'
import dynamic from 'next/dynamic'
import { withRouter } from 'next/router'
import Prism from 'prismjs'

import { createReactComponentGenerator } from '@teleporthq/teleport-component-generator-react'
import { createVueComponentGenerator } from '@teleporthq/teleport-component-generator-vue'
import { UIDLTypes, GeneratorTypes, ComponentGenerator } from '@teleporthq/teleport-types'

import simpleComponentUIDL from '../../inputs/simple-component.json'
import complexComponentUIDL from '../../inputs/complex-component.json'
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

const reactStylesPlugins = [
  'InlineStyles',
  'JSS',
  'StyledJSX',
  'CSSModules',
  'StyledComponents',
]
const reactGenerators: Record<string, ComponentGenerator> = reactStylesPlugins.reduce(
  (table, plugin) => ({
    ...table,
    [plugin]: createReactComponentGenerator(plugin),
  }),
  {}
)

const uidlSamples: Record<string, UIDLTypes.ComponentUIDL> = {
  'simple-component': simpleComponentUIDL,
  'complex-component': complexComponentUIDL,
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
      sourceJSON: 'simple-component',
      inputJson: jsonPrettify(uidlSamples['simple-component']),
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
        list={reactStylesPlugins}
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
          <div className="editor-header">
            <DropDown
              list={this.getSamplesName()}
              onChoose={this.handleSourceChange}
              value={this.state.sourceJSON}
            />
            <div className="editor-header-section">
              <h3>UIDL</h3>
            </div>
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
              options={libraries}
              selected={this.state.targetLibrary}
              onChoose={this.handleTargetChange}
            />
            <div className="editor-header-section">
              <h3>GENERATED CODE</h3>
            </div>
            {this.renderDropDownFlavour()}
          </div>
          <div className="code-wrapper">
            <div className="preview-scroller-y">
              <div className="preview-scroller-x">
                <pre className="previewer">
                  <code className="language-jsx">{this.state.generatedCode}</code>
                </pre>
              </div>
            </div>
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
            .editor-header-section {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;
              position: absolute;
              height: 30px;
              z-index: -1;
            }

            .editor h3 {
              margin: 0;
              padding: 0;
              color:  var(--editor-white-50);
              font-weight: 300;
              font-size: 14px;
            }

            .code-wrapper {
              height: calc(100% - 30px);
              position: relative;
              overflow: auto;
              background: var(--editor-bg-black);
            }

            .preview-scroller-y {
              height: 100%;
              width: 100%;
              position: absolute;
              top: 0;
              left: 0;
              background: var(--editor-bg-black);
            }

            .preview-scroller-x {
              position: absolute;
              top: 0;
              left: 0;
              background: var(--editor-bg-black);
            }

            .preview-scroller-x::-webkit-scrollbar-corner,
            .preview-scroller-y::-webkit-scrollbar-corner {
              background: var(--editor-bg-black);
              height: 10px;
              width: 10px;
            }

            .preview-scroller-x::-webkit-scrollbar,
            .preview-scroller-y::-webkit-scrollbar {
              width: 10px;
              height: 10px;
            }

            .preview-scroller-x::-webkit-scrollbar-thumb, .preview-scroller-y::-webkit-scrollbar-thumb {
              background: var(--editor-scrollbar-color);
              border-radius: 5px;
            }

            .code-wrapper .previewer {
              margin: 0;
              padding: 5px 0 0 10px;
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

            @media screen and (max-width: 992px) {
              .editor h3 {
                display: none;
              }

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

const libraries = ['react', 'vue']
const chooseGenerator = (flavor: string) => {
  const [library, plugin] = flavor.split('.')
  if (library === 'vue') {
    return vueGenerator
  }

  if (library === 'react') {
    return reactGenerators[plugin]
  }

  return reactGenerators.InlineStyles
}
