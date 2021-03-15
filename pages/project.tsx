import React, { useEffect, useState } from 'react'
import { GeneratedFolder } from '@teleporthq/teleport-types'
import { AppPage } from '../components/AppPage'
import dynamic from 'next/dynamic'
import projectJSON from '../inputs/project.json'
import { TopBar } from '../components/TopBar'
import { createReactProjectGenerator } from '@teleporthq/teleport-project-generator-react'
import { SandpackFiles } from '@codesandbox/sandpack-react'
import throttle from 'lodash.throttle'

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

const CodeEditor = dynamic(import('../components/CodeEditor'), {
  ssr: false,
})
const BrowserPreview = dynamic(import('../components/BrowserPreview'))
const generator = createReactProjectGenerator()

const generate = async (uidl: Record<string, unknown>) => {
  try {
    const { files: filesFromFolder, subFolders } = await generator.generateProject(uidl)
    const packageJSON = filesFromFolder.find(
      (file) => file.name === 'package' && file.fileType === 'json'
    )
    if (!packageJSON) {
      return
    }
    const mappedFiles = {
      ['/package.json']: {
        code: JSON.stringify(fixPackageJSONForReact(packageJSON.content), null, 2),
        active: true,
      },
      ...mapFiles(subFolders, ''),
    }
    return mappedFiles
  } catch (e) {
    throw new Error(e)
  }
}

const mapFiles = (folders: GeneratedFolder[], currentPath: string) => {
  return folders.reduce((acc: SandpackFiles, folder) => {
    const { files: subFiles, subFolders } = folder
    subFiles.map(
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
          <BrowserPreview files={files} displayFiles={true} />
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
