import path from 'path'
import fs from 'fs'
import { removeDir, copyDirRec, readJSON, writeTextFile } from '../../utils'
import createVueGenerator from '../../../component-generators/vue/vue-component'
import projectJson from '../../../../inputs/project.json'

import { ComponentDependency } from '../../../component-generators/pipeline/types'

import nuxtMapping from './elements-mapping.json'
import customMapping from './custom-mapping.json'

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

const generateComponent = createVueGenerator({
  customMapping: { ...nuxtMapping, ...customMapping },
})

const distPath = 'dist'
const templatePath = 'project-template'

const generateProject = async (jsDoc: any) => {
  if (jsDoc.schema !== 'project') {
    // This will be updated to JSON Schema validation
    throw new Error('schema type is not project')
  }

  await removeDir(distPath)
  await copyDirRec(templatePath, distPath)

  const { components, root } = jsDoc

  const pagesFolder: Folder = {
    name: 'pages',
    files: [],
    subFolders: [],
  }

  const componentsFolder: Folder = {
    name: 'components',
    files: [],
    subFolders: [],
  }

  let collectedDependencies = {}

  // Handling the route component which specifies which components are pages
  const { states } = root
  for (const key of Object.keys(states)) {
    const currentState = states[key]
    const pageComponent = currentState.component

    const pageResult = await generateComponent(pageComponent, {
      localDependenciesPrefix: '../components/',
    })

    collectedDependencies = { ...collectedDependencies, ...pageResult.dependencies }

    pagesFolder.files.push({
      name: computeFileName(key, currentState),
      content: pageResult.code,
      extension: '.vue',
    })
  }

  // The rest of the components are written in components
  for (const componentName of Object.keys(components)) {
    const component = components[componentName]
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
    pagesFolder,
    componentsFolder,
    dependencies: collectedDependencies,
  }
}

const runGenerator = async () => {
  const result = await generateProject(projectJson)
  const { pagesFolder, componentsFolder, dependencies } = result
  await writeFolderToDisk(pagesFolder, distPath)
  await writeFolderToDisk(componentsFolder, distPath)
  const externalDep = processExternalDependencies(dependencies)
  await writePackageJson(path.join(templatePath, 'package.json'), distPath, externalDep)
  // tslint:disable-next-line:no-console
  console.log('Done!')
}

runGenerator()

const computeFileName = (stateKey: string, stateBranch: any) => {
  if (stateBranch.default) {
    return 'index'
  }

  if (!stateBranch.meta || !stateBranch.meta.url) {
    // tslint:disable-next-line:no-console
    console.warn(
      `State node "${stateKey}" did not specify any meta url attribute. Assuming filename: "${stateKey}"`
    )
    return stateKey
  } else {
    return stateBranch.meta.url
  }
}

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
