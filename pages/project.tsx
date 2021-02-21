import React, { useEffect, useState } from 'react'
import { GeneratedFolder } from '@teleporthq/teleport-types'
import { Sandpack, SandpackFiles, SandpackProvider } from 'react-smooshpack'
import { AppPage } from '../components/AppPage'
import dynamic from 'next/dynamic'
import projectJSON from '../inputs/project.json'
import { TopBar } from '../components/TopBar'
import { createReactProjectGenerator } from '@teleporthq/teleport-project-generator-react'

/* Till this get's fixed.
Reference --> https://github.com/teleporthq/teleport-code-generators/issues/540 */
const fixPackageJSONForReact = (json: string) => {
  const packageJSON = JSON.parse(json)
  packageJSON.dependencies = {
    ...packageJSON.dependencies,
    ...{
      react: '^17.0.0',
      'react-dom': '^17.0.0',
      'react-scripts': '^4.0.0',
      'react-router-dom': '5.1.2',
    },
  }
  return packageJSON
}

const SandpackWrapper: React.FC<{ files: SandpackFiles }> = ({ files }) => {
  console.log(files)
  return (
    <>
      <Sandpack
        theme="sp-dark"
        template="react"
        files={files}
        options={{
          showNavigator: true,
          showLineNumbers: true,
          showTabs: true,
          wrapContent: true,
        }}
      />
    </>
  )
}

const CodeEditor = dynamic(import('../components/CodeEditor'), {
  ssr: false,
})
const generator = createReactProjectGenerator()

const ProjectPreview = () => {
  const [files, setFiles] = useState<SandpackFiles>({})
  const [uidl, setUIDL] = useState(projectJSON)
  const hadleUIDLChange = (value: string) => {
    setUIDL(JSON.parse(value))
    generate()
  }

  useEffect(() => {
    generate()
  }, [])

  const mapFiles = (folders: GeneratedFolder[], currentPath: string) => {
    return folders.reduce((acc: SandpackFiles, folder) => {
      const { files, subFolders } = folder
      files.map(
        (file) =>
          (acc[`${currentPath}/${folder.name}/${file.name}.${file.fileType}`] = {
            code: file.content,
          })
      )
      if (subFolders.length > 0) {
        acc = { ...acc, ...mapFiles(subFolders, `/${folder.name}`) }
      }
      return acc
    }, {})
  }

  const generate = async () => {
    try {
      const { files, subFolders } = await generator.generateProject(uidl)
      const packageJSON = files.find(
        (file) => file.name === 'package' && file.fileType === 'json'
      )
      if (!packageJSON) {
        return
      }
      setFiles({
        ['/package.json']: {
          code: JSON.stringify(fixPackageJSONForReact(packageJSON.content), null, 2),
        },
        ...mapFiles(subFolders, ''),
      })
    } catch (e) {
      throw new Error(e)
    }
  }

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
          <SandpackWrapper files={files} />
        </div>
      </div>
      <style jsx>
        {`
          .project-preview-wrapper {
            display: flex;
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
