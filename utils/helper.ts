import { GeneratedFolder } from '@teleporthq/teleport-types'
import { createReactProjectGenerator } from '@teleporthq/teleport-project-generator-react'
import { SandpackFiles } from '@codesandbox/sandpack-react'

/* Till this get's fixed.
Reference --> https://github.com/teleporthq/teleport-code-generators/issues/540 */
export const fixPackageJSONForReact = (json: string) => {
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

export const generate = async (uidl: Record<string, unknown>) => {
  try {
    const generator = createReactProjectGenerator()
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
