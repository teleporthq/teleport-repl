import React from 'react'
import dynamic from 'next/dynamic'
import Prism from 'prismjs'

import {
  createReactComponentGenerator,
  createVueComponentGenerator,
  UIDLTypes,
  GeneratorTypes,
} from '@teleporthq/teleport-code-generators'
import { ReactComponentStylingFlavors } from '@teleporthq/teleport-code-generators/dist/component-generators/react/react-component'

import authorCardUIDL from '../../inputs/component-author-card.json'
import tabSelectorUIDL from '../../inputs/component-tab-selector.json'
import cardListUIDL from '../../inputs/component-card-list.json'
import newComponentUIDL from '../../inputs/new-component.json'

const CodeEditor = dynamic(import('../CodeEditor'), {
  ssr: false,
})

import { DropDown } from '../DropDown'
import { Tabs } from '../Tabs'

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
  libraryFlavor: string
}

const jsonPrettify = (json: UIDLTypes.ComponentUIDL): string => {
  return JSON.stringify(json, null, 2)
}

class CodeScreen extends React.Component<{}, CodeScreenState> {
  constructor(props: {}) {
    super(props)
    this.state = {
      generatedCode: '',
      sourceJSON: 'new-component',
      inputJson: jsonPrettify(uidlSamples['new-component']),
      targetLibrary: 'react',
      libraryFlavor: 'StyledJSX',
    }
  }

  public componentDidMount() {
    this.handleInputChange()
  }

  public handleJSONUpdate = (inputJson: string) => {
    if (!inputJson) {
      return false
    }

    this.setState({ inputJson }, this.handleInputChange)
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
      this.setState({ generatedCode: '' })
      // tslint:disable-next-line:no-console
      console.error('generateReactComponent', err)
    }
  }

  public handleSourceChange = (source: { target: { value: string } }): void => {
    const {
      target: { value },
    } = source

    const sourceJSON = jsonPrettify(uidlSamples[value])
    this.setState({ inputJson: sourceJSON, sourceJSON: value }, this.handleInputChange)
  }

  public handleTargetChange = (target: string) => {
    const libraryFlavor = target === 'react' ? 'StyledJSX' : ''
    this.setState({ targetLibrary: target, libraryFlavor }, this.handleInputChange)
  }

  public render() {
    return (
      <div className="main-content">
        <div className="editor">
          <div className="editor-header">
            <div className="header-list with-offset">
              <DropDown
                list={Object.keys(uidlSamples)}
                onChoose={this.handleSourceChange}
                value={this.state.sourceJSON}
              />
            </div>
          </div>
          <CodeEditor
            editorDomId={'json-editor'}
            mode={'json'}
            value={this.state.inputJson}
            onChange={this.handleJSONUpdate}
          />
        </div>
        <div className="editor">
          <div className="editor-header">
            <Tabs
              options={generators}
              selected={this.state.targetLibrary}
              onChoose={this.handleTargetChange}
            />
          </div>
          <pre className="code-previewer">
            <code className={`language-jsx`}>{this.state.generatedCode}</code>
          </pre>
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
              padding: 0 0 30px 0;
            }
            .editor-header {
              height: 50px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              border-bottom: solid 1px #cccccc20;
            }

            .with-offset {
              margin-left: 50px;
            }

            .header-list {
              align-items: center;
              display: flex;
              list-style-type: none;
              padding: 10px;
              color: #ccc;
            }

            .header-list > li {
              padding: 5px 10px;
              margin-right: 3px;
            }

            .header-list > li.selected {
              background-color: var( --main-bg-white);
              color: var(--editor-bt-text-color);
              cursor: default;
              border-radius: 3px;
            }

            .header-list {
              cursor: pointer;
            }

            .file-chooser {
              height: 40px;
            }

            .code-previewer {
              height: calc(100% - 50px);
            }

          `}</style>
      </div>
    )
  }
}

export { CodeScreen }

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
