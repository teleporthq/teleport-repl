import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Prism from 'prismjs'
import Modal from 'react-modal'
import { ReactStyleVariation, StyleVariation } from '@teleporthq/teleport-types'
import { copyToClipboard } from 'copy-lite'
import { DropDown } from '../DropDown'
import { ComponentType, CodeScreenProps } from './types'
import {
  DefaultStyleFlavors,
  uidlSamples,
  getStyleFlavorsForTarget,
  FLAVORS_WITH_STYLES,
  dashToSpace,
  spaceToDash,
} from './utils'
import { withCustomRouter } from '../../utils/with-router'
import { styles, customStyle } from './styles'
import { generateComponent } from './generators'
import { ErrorPanel } from '../ErrorPanel'
import { uploadUIDLJSON, fetchJSONDataAndLoad } from '../../utils/services'
import Loader from '../Loader'

const CodeEditor = dynamic(import('../CodeEditor'), {
  ssr: false,
})
const BrowserPreview = dynamic(import('../BrowserPreview'))

const Code: React.FC<CodeScreenProps> = ({ router }) => {
  const [uidlSource, setUIDLSource] = useState<string>('simple-component')
  const [sourceList, setSourceList] = useState<string[]>(Object.keys(uidlSamples))
  const [error, setError] = useState<string | null>(null)
  const [share, setLink] = useState<{
    link: string | null
    loading: boolean
    copied?: boolean
    modal: boolean
  }>({
    link: null,
    loading: false,
    copied: false,
    modal: false,
  })
  const [componentUIDL, setComponentUIDL] = useState<Record<string, unknown>>(
    uidlSamples[uidlSource]
  )
  const [component, setComponent] = useState<{
    type: ComponentType
    style?: StyleVariation
    dependencies?: Record<string, string>
  }>({
    type: ComponentType.REACT,
    style: ReactStyleVariation.CSSModules,
  })
  const [code, setCode] = useState<string | null>(null)
  const [preview, setPreview] = useState<{
    code: string | null
    dependencies?: Record<string, string>
  }>({
    code: null,
  })

  useEffect(() => {
    const { uidlLink, flavor, style } = router?.query || {}
    if (uidlLink) {
      handleExternalLink(uidlLink)
    }

    if (flavor && !style && Object.values(ComponentType).includes(flavor)) {
      setComponent({
        type: flavor,
      })
      return
    }

    if (
      flavor &&
      Object.values(ComponentType).includes(flavor) &&
      style &&
      FLAVORS_WITH_STYLES.includes(flavor)
    ) {
      setComponent({
        type: flavor,
        style: dashToSpace(style) as StyleVariation,
      })
    }
  }, [])

  useEffect(() => {
    handleGenerateCode()
  }, [component.type, component.style, componentUIDL])

  useEffect(() => {
    handlePreview()
  }, [componentUIDL])

  useEffect(() => {
    Prism.highlightAll()
  }, [code])

  useEffect(() => {
    setComponentUIDL(uidlSamples[uidlSource])
  }, [uidlSource])

  const handleExternalLink = async (fileName: string) => {
    try {
      const result = await fetchJSONDataAndLoad(fileName)
      if (result) {
        setUIDLSource('externa-link')
        setSourceList([...sourceList, 'externa-link'])
        setComponentUIDL(JSON.parse(result))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handlePreview = async () => {
    try {
      const { code, dependencies } = await generateComponent(
        componentUIDL,
        ComponentType.REACT,
        ReactStyleVariation.StyledComponents
      )
      setPreview({ code, dependencies })
    } catch (e) {
      console.error(e)
    }
  }

  const handleGenerateCode = async () => {
    try {
      const { code } = await generateComponent(
        componentUIDL,
        component.type,
        component.style
      )
      setError(null)
      setCode(code)
    } catch (e) {
      console.error(e)
      setError(e)
    }
  }

  const handleSourceChange = (source: { target: { value: string } }): void => {
    const {
      target: { value },
    } = source
    setUIDLSource(value)
  }

  const handleJSONUpdate = (inputJSON: string) => {
    try {
      if (inputJSON && typeof inputJSON === 'string' && inputJSON.length > 0) {
        setComponentUIDL(JSON.parse(inputJSON))
      }
    } catch (e) {
      console.error(e)
      throw new Error(`Invalid UIDl`)
    }
  }

  const handleChangeComponentType = (ev: { target: { value: string } }) => {
    const type = ev.target.value as ComponentType
    setComponent({
      type,
      ...(DefaultStyleFlavors[type] && {
        style: DefaultStyleFlavors[type] as StyleVariation,
      }),
    })
  }

  const handleStyleFlavorSelect = (ev: { target: { value: string } }) => {
    setComponent({
      ...component,
      style: ev.target.value as StyleVariation,
    })
  }

  const generateSharableLink = async () => {
    setLink({ link: null, loading: true, modal: true })
    try {
      const response = await uploadUIDLJSON(
        JSON.stringify(componentUIDL, null, 2),
        'component'
      )
      if (response && response?.fileName) {
        let shareableLink = `${window.location}?uidlLink=${response.fileName}`
        if (
          component?.type &&
          component.style &&
          FLAVORS_WITH_STYLES.includes(component.type)
        ) {
          setLink({
            link: `${shareableLink}&flavor=${component.type}&style=${spaceToDash(
              component.style as string
            )}`,
            loading: false,
            modal: true,
          })
        } else if (component.type) {
          setLink({
            link: `${shareableLink}&flavor=${component.type}`,
            loading: false,
            modal: true,
          })
        } else {
          setLink({
            link: shareableLink,
            loading: false,
            modal: true,
          })
        }
      }
    } catch (e) {
      setLink({ link: null, loading: false, modal: false })
      console.error(e)
    }
  }

  return (
    <div className="main-content">
      <Modal
        isOpen={share.modal}
        style={customStyle}
        ariaHideApp={false}
        onRequestClose={() => setLink({ link: null, loading: false, modal: false })}
      >
        <div>
          {share?.loading && <Loader />}
          {!share.loading && (
            <>
              {share?.copied && <div className="copied-text fade-in">Copied</div>}
              <h4>Share working UIDL</h4>
              <div className="shareable-link">{share.link}</div>
              <div className="modal-buttons">
                <button
                  className="modal-button close-button"
                  onClick={() => setLink({ link: null, loading: false, modal: false })}
                >
                  Close
                </button>
                {share.link && (
                  <button
                    className="modal-button"
                    onClick={() => {
                      copyToClipboard(share.link as string)
                      setLink({ ...share, copied: true })
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
      <div className="editor">
        <div className="editor-header">
          <DropDown list={sourceList} onChoose={handleSourceChange} value={uidlSource} />
          <button className="share-button" onClick={generateSharableLink}>
            Share UIDL
          </button>
        </div>
        <div className="code-wrapper">
          <CodeEditor
            editorDomId={'json-editor'}
            mode={'json'}
            value={JSON.stringify(componentUIDL, null, 2)}
            onChange={handleJSONUpdate}
          />
        </div>
      </div>
      <div className="editor">
        <div className="editor-header previewer-header">
          <DropDown
            list={Object.values(ComponentType)}
            onChoose={handleChangeComponentType}
            value={component.type}
          />
          {component.type && DefaultStyleFlavors[component.type] && (
            <DropDown
              list={Object.values(getStyleFlavorsForTarget(component.type))}
              onChoose={handleStyleFlavorSelect}
              value={component.style || ''}
            />
          )}
          <button className="share-button">Render</button>
        </div>
        <div className="code-wrapper">
          <div className="preview-scroller-y">
            <div className="preview-scroller-x">
              <pre className="previewer">
                {code && <code className="language-jsx">{code}</code>}
              </pre>
            </div>
          </div>
        </div>
        <ErrorPanel error={error} visible={error ? true : false} />
      </div>
      <div className="editor">
        <BrowserPreview
          options={{
            ...(preview?.code && {
              files: { '/App.js': { code: preview.code } },
            }),
            dependencies: {
              ...(preview.dependencies && preview.dependencies),
              ...{
                'prop-types': 'latest',
              },
            },
          }}
        />
      </div>
      <style jsx>{styles}</style>
    </div>
  )
}

const CodeScreen = withCustomRouter(Code)
export { CodeScreen }
