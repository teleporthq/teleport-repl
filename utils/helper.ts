import { GeneratedFolder } from '@teleporthq/teleport-types'
import {
  createReactProjectGenerator,
  ReactTemplate,
} from '@teleporthq/teleport-project-generator-react'
import { SandpackFiles } from '@codesandbox/sandpack-react'

export const generateProject = async (
  uidl: Record<string, unknown>
): Promise<SandpackFiles | null> => {
  try {
    const generator = createReactProjectGenerator()
    const { files, subFolders } = await generator.generateProject(uidl, ReactTemplate)
    const mappedFiles = mapFiles(subFolders, '')
    files.forEach((file) => {
      mappedFiles[`/${file.name}.${file.fileType}`] = { code: file.content, active: true }
    })
    return mappedFiles
  } catch (e) {
    throw new Error(e)
  }
}

export const mapFiles = (folders: GeneratedFolder[], currentPath: string) => {
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
