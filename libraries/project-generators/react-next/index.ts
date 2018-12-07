// tslint:disable:no-console

import path from 'path'

import projectJson from '../../../inputs/project.json'

import createAssemblyLine, {
  ReactComponentFlavors,
} from '../../component-generators/react/react-component'

import nextMapping from './elements-mapping.json'
import customMapping from './custom-mapping.json'

import {
  // tsEnumToArray,
  copyDirRec,
  removeDir,
  writeTextFile,
  mkdir,
  readJSON,
} from '../utils'

const componentGenerator = createAssemblyLine({
  variation: ReactComponentFlavors.StyledJSX,
})

const processProjectUIDL = async (jsDoc: any) => {
  // pick root name/id

  const { components, root } = jsDoc

  const pagesDir: any = []

  const componentsDir: any = []
  let allDependencies: any = {}

  // page compnents first
  const { states } = root
  // tslint:disable-next-line:forin
  for (const stateKey in states) {
    const state = states[stateKey]

    const compiledComponent = await componentGenerator(state.component, {
      localDependenciesPrefix: '../components/',
      customMapping: { ...nextMapping, ...customMapping },
    })
    const fileName = state.meta && state.meta.url ? state.meta.url : stateKey
    pagesDir.push({
      type: 'file',
      name: state.default ? `index.js` : `${fileName.toLowerCase()}.js`,
      content: {
        code: compiledComponent.code,
      },
    })

    allDependencies = {
      ...allDependencies,
      ...compiledComponent.dependencies,
    }
  }

  // tslint:disable-next-line:forin
  for (const componentKey in components) {
    const comp = components[componentKey]

    try {
      const compiledComponent = await componentGenerator(comp, {
        customMapping: { ...nextMapping, ...customMapping },
      })
      componentsDir.push({
        type: 'file',
        name: `${comp.name}.js`,
        content: compiledComponent,
      })

      allDependencies = {
        ...allDependencies,
        ...compiledComponent.dependencies,
      }
    } catch (err) {
      console.error(componentKey, err)
    }
  }

  return { fileTree: { pagesDir, componentsDir }, allDependencies }
}

interface GeneratorInputParams {
  inputPath: string
  distPath: string
  uidlInput: any
}

const run = async (params: GeneratorInputParams) => {
  const { inputPath, distPath, uidlInput } = params
  await removeDir(distPath)
  await copyDirRec(inputPath, distPath)

  const { fileTree, allDependencies } = await processProjectUIDL(uidlInput)

  const filesInPages = fileTree.pagesDir
  const pagesDirLength = filesInPages.length

  let fileInfo

  await mkdir(`${distPath}/pages`)
  for (let i = 0; i < pagesDirLength; i++) {
    fileInfo = filesInPages[i]
    await writeTextFile(`${distPath}/pages`, fileInfo.name, fileInfo.content.code)
  }

  const filesInComponents = fileTree.componentsDir
  const componentsFilesLength = filesInComponents.length

  await mkdir(`${distPath}/components`)

  for (let i = 0; i < componentsFilesLength; i++) {
    fileInfo = filesInComponents[i]
    await writeTextFile(`${distPath}/components`, fileInfo.name, fileInfo.content.code)
  }

  const extraDeps = Object.keys(allDependencies)
    .filter((key) => {
      return allDependencies[key].type !== 'local'
    })
    .reduce((acc: any, key) => {
      const depInfo = allDependencies[key]
      acc[depInfo.meta.path] = depInfo.meta.version

      return acc
    }, {})

  const packageJSON = await readJSON(`${inputPath}/package.json`)
  if (!packageJSON) {
    throw new Error('could not reach package json')
  }

  packageJSON.dependencies = {
    ...packageJSON.dependencies,
    ...extraDeps,
  }

  writeTextFile(distPath, 'package.json', JSON.stringify(packageJSON, null, 2))
}

const boilerpaltePath = path.resolve(__dirname, './project-boilerplate')
const distGeneratorPath = path.resolve(__dirname, './dist')

run({
  uidlInput: projectJson,
  inputPath: boilerpaltePath,
  distPath: distGeneratorPath,
}).catch((err) => console.error(err))
