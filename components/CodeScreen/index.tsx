import { createAngularComponentGenerator } from '@teleporthq/teleport-component-generator-angular'
import { PreactStyleVariation } from '@teleporthq/teleport-component-generator-preact'
import {
  ReactStyleVariation,
  createReactComponentGenerator,
} from '@teleporthq/teleport-component-generator-react'
import { createStencilComponentGenerator } from '@teleporthq/teleport-component-generator-stencil'
import { createVueComponentGenerator } from '@teleporthq/teleport-component-generator-vue'
import {
  CompiledComponent,
  ComponentGenerator,
  ComponentUIDL,
  GeneratedFile,
  ReactNativeStyleVariation,
} from '@teleporthq/teleport-types'
import { copyToClipboard } from 'copy-lite'
import dynamic from 'next/dynamic'
import { withRouter } from 'next/router'
import Prism from 'prismjs'
import queryString from 'query-string'
import React from 'react'
import Modal from 'react-modal'
import complexComponentUIDL from '../../inputs/complex-component.json'
import contactForm from '../../inputs/contact-form.json'
import expandableArealUIDL from '../../inputs/expandable-area.json'
import navbar from '../../inputs/navbar.json'
import personList from '../../inputs/person-list.json'
import personSpotlight from '../../inputs/person-spotlight.json'
import customMapping from '../../inputs/repl-mapping.json'
import simpleComponentUIDL from '../../inputs/simple-component.json'
import externalComponentUIDL from '../../inputs/external-components.json'
import antButtonComponentUIDL from '../../inputs/antd-button.json'
import reactBootStrapComponentUIDL from '../../inputs/react-bootstrap.json'
import tabSelector from '../../inputs/tab-selector.json'
import { fetchJSONDataAndLoad, uploadUIDLJSON, bundler } from '../../utils/services'
import { DropDown } from '../DropDown'
import { ErrorPanel } from '../ErrorPanel'
import Loader from '../Loader'
import {
  ComponentType,
  createAllPreactStyleFlavors,
  createAllReactStyleFlavors,
  createAllReactNativeStyleFlavors,
  DefaultStyleFlavors,
} from './utils'
import throttle from 'lodash.throttle'

const throttledBundler = throttle(bundler, 500)

const CodeEditor = dynamic(import('../CodeEditor'), {
  ssr: false,
})

type GeneratorsCache = Record<
  ComponentType,
  ComponentGenerator | Record<string, ComponentGenerator>
>

type StyleVariation =
  | ReactStyleVariation
  | PreactStyleVariation
  | ReactNativeStyleVariation

const generatorsCache: GeneratorsCache = {
  [ComponentType.ANGULAR]: createAngularComponentGenerator(),
  [ComponentType.VUE]: createVueComponentGenerator(),
  [ComponentType.STENCIL]: createStencilComponentGenerator(),
  [ComponentType.REACT]: createAllReactStyleFlavors(),
  [ComponentType.PREACT]: createAllPreactStyleFlavors(),
  [ComponentType.REACTNATIVE]: createAllReactNativeStyleFlavors(),
}

const uidlSamples: Record<string, ComponentUIDL> = {
  'simple-component': simpleComponentUIDL as ComponentUIDL,
  'external-component': (externalComponentUIDL as unknown) as ComponentUIDL,
  'antd-button': (antButtonComponentUIDL as unknown) as ComponentUIDL,
  'react-bootstrap': (reactBootStrapComponentUIDL as unknown) as ComponentUIDL,
  navbar: (navbar as unknown) as ComponentUIDL,
  'contact-form': (contactForm as unknown) as ComponentUIDL,
  'person-spotlight': (personSpotlight as unknown) as ComponentUIDL,
  'person-list': (personList as unknown) as ComponentUIDL,
  'complex-component': (complexComponentUIDL as unknown) as ComponentUIDL,
  'expandable-area': (expandableArealUIDL as unknown) as ComponentUIDL,
  'tab-selector': (tabSelector as unknown) as ComponentUIDL,
}

interface CodeScreenState {
  generatedCode: string
  targetLibrary: ComponentType
  inputJson: string
  sourceJSON: string
  libraryFlavor: StyleVariation
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
      targetLibrary: ComponentType.REACT,
      libraryFlavor: ReactStyleVariation.CSSModules,
      externalLink: false,
      showErrorPanel: false,
      showShareableLinkModal: false,
      isLoading: false,
      copied: false,
      error: null,
    }
  }

  public async componentDidMount() {
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
            () => {
              this.handleInputChange()
              this.preview()
            }
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
    this.setState({ showErrorPanel: false })
    const { targetLibrary, inputJson, libraryFlavor } = this.state
    let jsonValue: any = null

    try {
      jsonValue = JSON.parse(inputJson)
    } catch (err) {
      return
    }

    const generator = chooseGenerator(targetLibrary, libraryFlavor)

    try {
      const result: CompiledComponent = await generator.generateComponent(jsonValue, {
        mapping: customMapping, // Temporary fix for svg's while the `line` element is converted to `hr` in the generators
      })
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
    }
  }

  public async preview() {
    const generator = createReactComponentGenerator(ReactStyleVariation.StyledComponents)
    try {
      const component = await generator.generateComponent(
        JSON.parse(this.state.inputJson)
      )
      const jsFile = component.files.find((file) => file.fileType === 'js')
      if (jsFile) {
        throttledBundler(jsFile)
      }
    } catch (e) {
      // @ts-ignore
      console.error(e)
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
      () => {
        this.handleInputChange()
        this.preview()
      }
    )
  }

  public handleTargetChange = (ev: { target: { value: string } }) => {
    const target = ev.target.value as ComponentType
    this.setState(
      {
        targetLibrary: target,
        libraryFlavor:
          (DefaultStyleFlavors[target] as StyleVariation) ||
          ReactStyleVariation.CSSModules,
      },
      this.handleInputChange
    )
  }

  public handleFlavourChange = (flavor: { target: { value: string } }) => {
    const {
      target: { value },
    } = flavor

    this.setState({ libraryFlavor: value as StyleVariation }, this.handleInputChange)
  }

  public renderDropDownFlavour = () => {
    const { targetLibrary } = this.state
    if (!DefaultStyleFlavors[targetLibrary]) {
      return null
    }

    const flavors = getFlavorsForTarget(targetLibrary)

    return (
      <DropDown
        list={Object.values(flavors)}
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
    const { showShareableLinkModal, isLoading, shareableLink } = this.state
    return (
      <div className="main-content">
        <div className="editor">
          <div className="editor-header">
            <DropDown
              list={this.getSamplesName()}
              onChoose={this.handleSourceChange}
              value={this.state.sourceJSON}
            />
            <button className="share-button" onClick={() => this.generateSharableLink()}>
              Share UIDL
            </button>
            <Modal
              isOpen={showShareableLinkModal}
              style={Code.customStyle}
              ariaHideApp={false}
              onRequestClose={() => {
                this.setState({
                  showShareableLinkModal: false,
                  isLoading: false,
                })
              }}
            >
              <div>
                {isLoading && <Loader />}
                {!isLoading && (
                  <>
                    {this.state.copied && (
                      <div className="copied-text fade-in">Copied</div>
                    )}
                    <h4>Share working UIDL</h4>
                    <div className="shareable-link">{shareableLink}</div>
                    <div className="modal-buttons">
                      <button
                        className="modal-button close-button"
                        onClick={() =>
                          this.setState({
                            showShareableLinkModal: false,
                            isLoading: false,
                          })
                        }
                      >
                        Close
                      </button>
                      {shareableLink && (
                        <button
                          className="modal-button"
                          onClick={() => {
                            copyToClipboard(shareableLink)
                            this.setState({ copied: true })
                          }}
                        >
                          Copy
                        </button>
                      )}
                    </div>
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
        </div>
        <div className="editor">
          <div className="editor-header previewer-header">
            <DropDown
              list={Object.values(ComponentType)}
              onChoose={this.handleTargetChange}
              value={this.state.targetLibrary}
            />
            {this.renderDropDownFlavour()}
            <button className="share-button" onClick={() => this.preview()}>
              Render
            </button>
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
          <ErrorPanel error={this.state.error} visible={this.state.showErrorPanel} />
        </div>
        <div className="preview-screen" id="render-output"></div>
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

            .iframe-size {
              width: 100%;
              height: 100%;
            }

            .editor {
              border-radius: 10px;
              width: 49%;
              background: var(--editor-bg-black);
              overflow: hidden;
              z-index: 3;
              padding: 0 0 30px 0;
              position: relative;
              margin-right: 5px;
              margin-left: 5px;
            }

            .preview-screen {
              color: #000;
              border-radius: 10px;
              width: 49%;
              border: 1px solid var(--editor-bg-black); 
              overflow: hidden;
              z-index: 3;
              padding: 5px;
              position: relative;
              margin-right: 5px;
              margin-left: 5px;
              overflow: scroll;
            }

            @media screen and (max-width: 762px){
              .main-content{
                padding: 20px 15px;
                display: grid;
                grid-template-rows: 1fr 1fr;
                grid-gap: 4%;
                justify-content: normal;
                overflow-y: scroll;
              }
              .editor{
                width: 99%;
                height: calc(100% - 30px);
              }
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
              padding: 10px;
              background: rgba(200, 200, 200, 0.5);
              user-select: all;
            }

            .modal-buttons {
              display: flex;
              justify-content: space-between;
              margin: 20px 0 0;
            }

            .modal-button {
              background: var(--color-purple);
              color: #fff;
              padding: 8px 16px;
              font-size: 14px;
              border-radius: 4px;
              border: 0 none;
            }

            .close-button {
              background: rgb(55, 55, 62);
            }

            .share-button {
              color: var(--color-purple);
              padding: 6px;
              margin-left: 15px;
              background-color: #fff;
              font-size: 14px;
              border-radius: 4px;
              border: 0 none;
            }

            .copied-text {
              position: absolute;
              top: 0;
              width: 100%;
              left: 0;
              padding: 5px 0;
              background-color: var(--success-green);
              color: #fff;
              opacity: 0;
            }

            .fade-in {
              animation: fadeInOpacity 1 ease-in 0.35s forwards;
            }

            @keyframes fadeInOpacity {
              0% {
                opacity: 0;
              }
              100% {
                opacity: 1;
              }
            }
          `}</style>
      </div>
    )
  }
}

const withCustomRouter = (ReplCode: any) => {
  return withRouter(({ router, ...props }: any): any => {
    if (router && router.asPath) {
      const query = queryString.parse(router.asPath.split(/\?/)[1])
      router = { ...router, query }
      return <ReplCode router={router} {...props} />
    }
  })
}

const CodeScreen = withCustomRouter(Code)
export { CodeScreen }

const jsonPrettify = (json: ComponentUIDL): string => {
  return JSON.stringify(json, null, 2)
}

const chooseGenerator = (library: ComponentType, stylePlugin: string) => {
  const generator = generatorsCache[library]

  if (typeof generator.generateComponent === 'function') {
    return generator as ComponentGenerator
  }

  return (generator as Record<string, ComponentGenerator>)[stylePlugin]
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

const getFlavorsForTarget = (target: ComponentType) => {
  switch (target) {
    case ComponentType.PREACT:
      return PreactStyleVariation
    case ComponentType.REACTNATIVE:
      return ReactNativeStyleVariation
    default:
      return ReactStyleVariation
  }
}
