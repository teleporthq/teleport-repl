import { SandpackFiles } from '@codesandbox/sandpack-react'
import React, { useEffect, useState } from 'react'
import throttle from 'lodash.throttle'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import Modal from 'react-modal'
import { copyToClipboard } from 'copy-lite'
import { AppPage } from '../../components/AppPage'
import projectJSON from '../../inputs/project.json'
import { TopBar } from '../../components/TopBar'
import { generateProject } from '../../utils/helper'
import { fetchJSONDataAndLoad, uploadUIDLJSON } from '../../utils/services'
import { customStyle } from '../../components/CodeScreen/styles'
import Loader from '../../components/Loader'

const CodeEditor = dynamic(import('../../components/CodeEditor'), {
  ssr: false,
})
const BrowserPreview = dynamic(import('../../components/BrowserPreview'))

interface ProjectProps {
  router: {
    query?: {
      fileName?: string
    }
  }
}

const ProjectPreview: React.FC<ProjectProps> = () => {
  const router = useRouter()
  const [files, setFiles] = useState<SandpackFiles>({})
  const [uidl, setUIDL] = useState(projectJSON)
  const [share, setShare] = useState<{
    link: string | null
    loading: boolean
    copied?: boolean
    modal: boolean
  }>({
    link: null,
    modal: false,
    loading: false,
    copied: false,
  })
  const hadleUIDLChange = (value: string) => {
    setUIDL(JSON.parse(value))
  }

  useEffect(() => {
    const { query } = router
    if (Object.keys(query).length === 1 && Object.keys(query)[0] === 'id') {
      const { id = [] } = query
      handleFetchUIDL(id[0])
    }
  }, [router.query])

  useEffect(() => {
    const compile = throttle(async () => {
      setFiles({})
      const generatedFiles = await generateProject(uidl)
      if (!generatedFiles) {
        return
      }
      setFiles(generatedFiles)
    }, 5000)
    compile()
  }, [uidl])

  const handleFetchUIDL = async (id: string) => {
    try {
      const response = await fetchJSONDataAndLoad(id)
      if (!response) {
        return
      }
      setUIDL(JSON.parse(response))
    } catch (e) {
      console.error(e)
      throw new Error(`Failed in fetching UIDL`)
    }
  }

  const handleShare = async () => {
    setShare({ link: null, loading: true, modal: true })
    try {
      const response = await uploadUIDLJSON(JSON.stringify(uidl, null, 2), 'project')
      if (response && response?.fileName) {
        setShare({
          link: `${window.location}/${response.fileName}`,
          loading: false,
          modal: true,
        })
      }
    } catch (e) {
      setShare({ link: null, loading: false, modal: false })
      console.error(e)
      throw new Error(`Failed in saving Project UIDL`)
    }
  }

  return (
    <AppPage>
      <TopBar />
      <Modal
        isOpen={share.modal}
        style={customStyle}
        ariaHideApp={false}
        onRequestClose={() => setShare({ link: null, loading: false, modal: false })}
      >
        {share.loading && <Loader />}
        {share.link && !share.loading && (
          <>
            {share?.copied && <div className="copied-text fade-in">Copied</div>}
            <h4>Share working UIDL</h4>
            <div className="shareable-link">{share.link}</div>
            <div className="modal-buttons">
              <button
                className="modal-button close-button"
                onClick={() => setShare({ link: null, loading: false, modal: false })}
              >
                Close
              </button>
              {share.link && (
                <button
                  className="modal-button"
                  onClick={() => {
                    copyToClipboard(share.link as string)
                    setShare({ ...share, copied: true })
                  }}
                >
                  Copy
                </button>
              )}
            </div>
          </>
        )}
      </Modal>
      <div className="project-preview-wrapper">
        <div className="left">
          <div className="editor-header">
            <div>{uidl.name}</div>
            <button className="share-button" onClick={handleShare}>
              Share UIDL
            </button>
          </div>
          <div className="code-wrapper">
            <CodeEditor
              editorDomId={'project-json-editor'}
              mode={'json'}
              value={JSON.stringify(uidl, null, 2)}
              onChange={hadleUIDLChange}
            />
          </div>
        </div>
        <div className="right">
          {Object.keys(files || {}).length > 0 && (
            <BrowserPreview options={{ files, displayFiles: true }} />
          )}
          {Object.keys(files || {}).length === 0 && (
            <div className="empty_state">
              <img className="logo" src="/static/svg/logo_white.svg" alt="Teleport HQ" />
              Listening for updates
            </div>
          )}
        </div>
      </div>
      <style jsx>
        {`
          .empty_state {
            height: 100%;
            display: flex;
            align-items: center;
            background-size: cover;
            justify-content: center;
            flex-direction: column;
            color: var(--main-text-color);
            font-family: var(--main-font-family);
            font-size: var(--main-text-font-size);
            background-image: url('/static/svg/hero.svg');
          }

          .logo {
            width: 200px;
            padding-bottom: 10px;
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

          .editor-header {
            height: 30px;
            display: flex;
            border-bottom: solid 1px var(--editor-bg-black);
            padding: 10px 30px;
            justify-content: space-between;
            align-items: center;
          }

          .code-wrapper {
            height: calc(100% - 52px);
            position: relative;
            overflow: auto;
            background: var(--editor-bg-black);
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

          .project-preview-wrapper {
            display: flex;
            padding: 5px;
            height: calc(100% - 80px);
          }

          .left {
            background-color: var(--editor-bg-black);
            width: 30%;
          }

          .right {
            width: 70%;
          }
        `}
      </style>
    </AppPage>
  )
}

export default ProjectPreview
