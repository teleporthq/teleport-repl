import path from 'path'
import fs from 'fs'
import { removeDir, copyDirRec, readJSON, writeTextFile } from '../../utils'
import createVueGenerator from './pipeline/vue-component'
import createVueRouterFileGenerator from './pipeline/vue-router'
import projectJson from './project.json'
import { ComponentDependency } from '../../../utils/experimental-generators/pipeline/types'

import customMappings from './customMappings'

interface Folder {
  name: string
  files: File[]
  subFolders: Folder[]
}

interface File {
  content: string
  name: string
  extension: string
}

const generateComponent = createVueGenerator(customMappings)
const generateRouterFile = createVueRouterFileGenerator()

const distPath = 'dist'
const templatePath = 'project-template'

const generateProject = async (jsDoc: any) => {
  if (jsDoc.schema !== 'project') {
    throw new Error('schema type is not project')
  }

  await removeDir(distPath)
  await copyDirRec(templatePath, distPath)

  const { components, root } = jsDoc

  const srcFolder: Folder = {
    name: 'src',
    files: [],
    subFolders: [],
  }

  const componentsFolder: Folder = {
    name: 'components',
    files: [],
    subFolders: [],
  }

  srcFolder.subFolders.push(componentsFolder)

  let collectedDependencies = {}

  // tslint:disable:next-line
  for (const componentName of Object.keys(components)) {
    const component = components[componentName]
    if (component.name === root) {
      const appUIDL = {
        name: 'App',
        content: {
          type: 'router-view',
          name: 'entry-point',
          children: ' ',
        },
      }

      const appResult = await generateComponent(appUIDL)
      collectedDependencies = {
        ...collectedDependencies,
        ...appResult.dependencies,
      }

      const appFile: File = {
        name: 'App',
        extension: '.vue',
        content: appResult.code,
      }

      srcFolder.files.push(appFile)

      const router = await generateRouterFile(component)
      collectedDependencies = { ...collectedDependencies, ...router.dependencies }

      const routerFile: File = {
        name: 'router',
        extension: '.js',
        content: router.code,
      }

      srcFolder.files.push(routerFile)

      continue
    }

    const componentResult = await generateComponent(component)
    collectedDependencies = { ...collectedDependencies, ...componentResult.dependencies }

    const file: File = {
      name: component.name,
      extension: '.vue',
      content: componentResult.code,
    }

    componentsFolder.files.push(file)
  }

  return {
    srcFolder,
    dependencies: collectedDependencies,
  }
}

const runGenerator = async () => {
  const result = await generateProject(projectJson)
  const { srcFolder, dependencies } = result
  await writeFolderToDisk(srcFolder, distPath)
  const externalDep = processExternalDependencies(dependencies)
  await writePackageJson(path.join(templatePath, 'package.json'), distPath, externalDep)
  // tslint:disable-next-line:no-console
  console.log('Done!')
}

runGenerator()

const processExternalDependencies = (dependencies: {
  [key: string]: ComponentDependency
}) => {
  return Object.keys(dependencies)
    .filter((key) => {
      return dependencies[key].type !== 'local'
    })
    .reduce((acc: any, key) => {
      const depInfo = dependencies[key]
      acc[depInfo.meta.path] = depInfo.meta.version

      return acc
    }, {})
}

const writePackageJson = async (sourcePackage, destinationPath, externalDep) => {
  const packageJSON = await readJSON(sourcePackage)
  if (!packageJSON) {
    throw new Error('could not find a package.json in the template folder')
  }

  packageJSON.dependencies = {
    ...packageJSON.dependencies,
    ...externalDep,
  }

  await writeTextFile(
    destinationPath,
    'package.json',
    JSON.stringify(packageJSON, null, 2)
  )
  // tslint:disable-next-line:no-console
  console.log('Created file: ', path.join(destinationPath, 'package.json'))
}

const writeFolderToDisk = async (folder: Folder, currentPath: string) => {
  const { name, files, subFolders } = folder

  const folderPath = path.join(currentPath, name)
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath)
    // tslint:disable-next-line:no-console
    console.log('Created folder: ', folderPath)
  }

  files.forEach((file) => {
    const filePath = path.join(folderPath, file.name + file.extension)
    fs.writeFileSync(filePath, file.content)
    // tslint:disable-next-line:no-console
    console.log('Created file: ', filePath)
  })

  subFolders.forEach((child) => writeFolderToDisk(child, folderPath))
}
