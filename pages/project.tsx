import React, { useEffect, useState } from 'react'
import { AppPage } from '../components/AppPage'
import dynamic from 'next/dynamic'
import projectJSON from '../inputs/project.json'
import { TopBar } from '../components/TopBar'
import { SandpackFiles } from '@codesandbox/sandpack-react'
import throttle from 'lodash.throttle'
import { generate } from '../utils/helper'

const CodeEditor = dynamic(import('../components/CodeEditor'), {
  ssr: false,
})
const BrowserPreview = dynamic(import('../components/BrowserPreview'))

const ProjectPreview = () => {
  const [files, setFiles] = useState<SandpackFiles>({})
  const [uidl, setUIDL] = useState(projectJSON)
  const hadleUIDLChange = (value: string) => {
    setUIDL(JSON.parse(value))
  }

  useEffect(() => {
    const compile = throttle(async () => {
      const generatedFiles = await generate(uidl)
      if (!generatedFiles) {
        return
      }
      setFiles(generatedFiles)
    }, 5000)
    compile()
  }, [uidl])

  return (
    <AppPage>
      <TopBar />
      <div className="project-preview-wrapper">
        <div className="left">
          <CodeEditor
            editorDomId={'project-json-editor'}
            mode={'json'}
            value={JSON.stringify(uidl, null, 2)}
            onChange={hadleUIDLChange}
          />
        </div>
        <div className="right">
          <BrowserPreview options={{ files, displayFiles: true }} />
        </div>
      </div>
      <style jsx>
        {`
          .project-preview-wrapper {
            display: flex;
            padding: 5px;
            height: calc(100% - 80px);
          }
          .left {
            background-color: #040404;
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
