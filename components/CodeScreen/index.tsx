import React from 'react'
import dynamic from 'next/dynamic'
import { withRouter } from 'next/router'
import Prism from 'prismjs'
import Modal from 'react-modal'
import queryString from 'query-string'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { fetchJSONDataAndLoad, uploadUIDLJSON } from '../../utils/services'

import { createReactComponentGenerator } from '@teleporthq/teleport-component-generator-react'
import { createVueComponentGenerator } from '@teleporthq/teleport-component-generator-vue'
import { createPreactComponentGenerator } from '@teleporthq/teleport-component-generator-preact'
import { createStencilComponentGenerator } from '@teleporthq/teleport-component-generator-stencil'
import { createAngularComponentGenerator } from '@teleporthq/teleport-component-generator-angular'
import {
  UIDLTypes,
  GeneratorTypes,
  ComponentGenerator,
  GeneratedFile,
} from '@teleporthq/teleport-types'

import simpleComponentUIDL from '../../inputs/simple-component.json'
import navbar from '../../inputs/navbar.json'
import contactForm from '../../inputs/contact-form.json'
import personSpotlight from '../../inputs/person-spotlight.json'
import personList from '../../inputs/person-list.json'
import complexComponentUIDL from '../../inputs/complex-component.json'
import expandableArealUIDL from '../../inputs/expandable-area.json'
import tabSelector from '../../inputs/tab-selector.json'
import customMapping from '../../inputs/repl-mapping.json'

const CodeEditor = dynamic(import('../CodeEditor'), {
  ssr: false,
})

import { DropDown } from '../DropDown'
import { Tabs } from '../Tabs'
import { ErrorPanel } from '../ErrorPanel'
import Loader from '../Loader'

const vueGenerator = createVueComponentGenerator()

const stencilGenerator = createStencilComponentGenerator()

const angularGenerator = createAngularComponentGenerator()

const reactStylePlugins = [
  'StyledComponents',
  'StyledJSX',
  'JSS',
  'CSSModules',
  'CSS',
  'InlineStyles',
]
const reactGenerators: Record<string, ComponentGenerator> = reactStylePlugins.reduce(
  (table, plugin) => ({
    ...table,
    [plugin]: createReactComponentGenerator(plugin),
  }),
  {}
)

const preactStylePlugins = ['CSS', 'CSSModules', 'InlineStyles']

const preactGenerators: Record<string, ComponentGenerator> = preactStylePlugins.reduce(
  (table, plugin) => ({
    ...table,
    [plugin]: createPreactComponentGenerator(plugin),
  }),
  {}
)

const uidlSamples: Record<string, UIDLTypes.ComponentUIDL> = {
  'simple-component': simpleComponentUIDL,
  navbar,
  'contact-form': contactForm,
  'person-spotlight': personSpotlight,
  'person-list': personList,
  'complex-component': complexComponentUIDL,
  'expandable-area': expandableArealUIDL,
  'tab-selector': tabSelector,
}

interface CodeScreenState {
  generatedCode: string
  targetLibrary: string
  inputJson: string
  sourceJSON: string
  libraryFlavor: string
  externalLink: boolean
  showErrorPanel: boolean
  showShareableLinkModal: boolean
  isLoading: boolean
  shareableLink?: string
  copied: boolean
  error: any
}

interface CodeProps {
  router: any
}

class Code extends React.Component<CodeProps, CodeScreenState> {
  public static customStyle: ReactModal.Styles = {
    overlay: {
      zIndex: 10,
    },
    content: {
      textAlign: 'center',
      color: '#000',
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      borderRadius: '4px',
      transform: 'translate(-50%, -50%)',
    },
  }

  constructor(props: CodeProps) {
    super(props)
    this.state = {
      generatedCode: '',
      sourceJSON: 'simple-component',
      inputJson: jsonPrettify(uidlSamples['simple-component']),
      targetLibrary: 'react',
      libraryFlavor: 'CSS',
      externalLink: false,
      showErrorPanel: false,
      showShareableLinkModal: false,
      isLoading: false,
      copied: false,
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

    fetchJSONDataAndLoad(uidlLink)
      .then((response) => {
        if (response) {
          this.setState(
            {
              inputJson: jsonPrettify(response),
              externalLink: true,
              sourceJSON: 'externalLink',
              showErrorPanel: false,
              error: null,
            },
            this.handleInputChange
          )
          return true
        }
      })
      .catch(() => {
        return false
      })
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

    const generator = chooseGenerator(targetLibrary, libraryFlavor)

    try {
      const result: GeneratorTypes.CompiledComponent = await generator.generateComponent(
        jsonValue,
        {
          mapping: customMapping, // Temporary fix for svg's while the `line` element is converted to `hr` in the generators
        }
      )

      const code = concatenateAllFiles(result.files)
      if (!code) {
        // tslint:disable-next-line:no-console
        console.log('no content')
        return
      }

      this.setState({ generatedCode: code }, Prism.highlightAll)
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
    this.setState({ targetLibrary: target, libraryFlavor: 'CSS' }, this.handleInputChange)
  }

  public handleFlavourChange = (flavor: { target: { value: string } }) => {
    const {
      target: { value },
    } = flavor

    this.setState({ libraryFlavor: value }, this.handleInputChange)
  }

  public renderDropDownFlavour = () => {
    const { targetLibrary } = this.state
    if (targetLibrary !== 'react' && targetLibrary !== 'preact') {
      return null
    }

    const plugins = targetLibrary === 'react' ? reactStylePlugins : preactStylePlugins

    return (
      <DropDown
        list={plugins}
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

  public generateSharableLink = () => {
    this.setState({ showShareableLinkModal: true, isLoading: true }, async () => {
      try {
        const response = await uploadUIDLJSON(this.state.inputJson)
        const { fileName } = response
        if (fileName) {
          this.setState({
            isLoading: false,
            shareableLink: `https://repl.teleporthq.io/?uidlLink=${fileName}`,
            showShareableLinkModal: true,
          })
        }
      } catch (err) {
        this.setState({
          isLoading: false,
          showShareableLinkModal: false,
        })
      }
    })
  }

  public render() {
    const { showShareableLinkModal, isLoading } = this.state
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
            <button className="share-button" onClick={() => this.generateSharableLink()}>
              Share UIDL
            </button>
            <Modal
              isOpen={showShareableLinkModal}
              style={Code.customStyle}
              ariaHideApp={false}
            >
              <div>
                {isLoading && <Loader />}
                {!isLoading && (
                  <>
                    <div className="shareable-link">{this.state.shareableLink}</div>
                    <div>
                      <CopyToClipboard
                        text={this.state.shareableLink}
                        onCopy={() => this.setState({ copied: true })}
                      >
                        <button className="close-button">Copy</button>
                      </CopyToClipboard>
                      <button
                        className="close-button"
                        onClick={() =>
                          this.setState({
                            showShareableLinkModal: false,
                            isLoading: false,
                          })
                        }
                      >
                        Close
                      </button>
                    </div>
                    {this.state.copied && <div className="copied-text">Copied !!</div>}
                  </>
                )}
              </div>
            </Modal>
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

            .shareable-link {
              background-color: var(--link-grey);
              padding: 10px;
              border-radius: 4px;
              border: 1px solid var(--editor-scrollbar-color);
            }

            .close-button {
              margin-top: 15px;
              padding: 5px;
              background-color: var(--color-purple);
              color: #fff;
              font-size: 15px;
              letter-spacing: 0.6px;
              display: inline-block;
              border-radius: 4px;
              cursor: pointer;
            }

            .share-button {
              color: var(--color-purple);
              padding: 6px;
              margin-left: 15px;
              background-color: #fff;
              font-size: 14px;
              border-radius: 4px;
              cursor: pointer;
            }

            .copied-text {
              padding: 5px;
              margin-top: 10px;
              line-height: 10px;
              font-size; 12px;
              margin-bottom: 10px;
              border-radius: 6px;
              background-color: var(--success-green);
              border: 1px solid var(--success-green);
              color: #fff;
              display: inline-block;
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

const withCustomRouter = (ReplCode) => {
  return withRouter(({ router, ...props }) => {
    if (router && router.asPath) {
      const query = queryString.parse(router.asPath.split(/\?/)[1])
      router = { ...router, query }
      return <ReplCode router={router} {...props} />
    }
  })
}

const CodeScreen = withCustomRouter(Code)
export { CodeScreen }

const jsonPrettify = (json: UIDLTypes.ComponentUIDL): string => {
  return JSON.stringify(json, null, 2)
}

const libraries = ['angular', 'preact', 'react', 'stencil', 'vue']
const chooseGenerator = (library: string, stylePlugin: string) => {
  if (library === 'vue') {
    return vueGenerator
  }

  if (library === 'preact') {
    return preactGenerators[stylePlugin]
  }

  if (library === 'angular') {
    return angularGenerator
  }

  if (library === 'stencil') {
    return stencilGenerator
  }

  if (library === 'react') {
    return reactGenerators[stylePlugin]
  }

  return reactGenerators.CSS
}

const concatenateAllFiles = (files: GeneratedFile[]) => {
  if (files.length === 1) {
    return files[0].content
  }

  return files.reduce((accCode, file) => {
    accCode += `// ${file.name}.${file.fileType}\n`
    accCode += file.content
    accCode += '\n'

    return accCode
  }, '')
}
