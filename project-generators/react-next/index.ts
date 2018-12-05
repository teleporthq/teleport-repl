// tslint:disable:no-console

import path from 'path'

import componentWithStates from '../../inputs/component-states'

import { configureNextPageAsemblyLine } from './pipeline/react-next-page'
import { configureAsemlyLine, ReactComponentFlavors } from './pipeline/react-component'

import {
  // tsEnumToArray,
  copyDirRec,
  removeDir,
  writeTextFile,
  mkdir,
  readJSON,
} from '../utils'

const componentGenerator = configureAsemlyLine({
  variation: ReactComponentFlavors.StyledJSX,
})

const pageGenerator = configureNextPageAsemblyLine()

const processProjectUIDL = async (jsDoc: any) => {
  // pick root name/id

  const { components, root } = jsDoc

  const pagesDir: any = []

  const compoenntsDir: any = []
  let allDependencies: any = {}
  let comp: any
  // tslint:disable-next-line:forin
  for (const componentKey in components) {
    comp = components[componentKey]

    if (comp.name === root) {
      try {
        const { states } = comp
        // tslint:disable-next-line:forin
        for (const stateKey in states) {
          if (stateKey === 'default') {
            continue
          }
          const state = states[stateKey]

          const compiledComponent = await pageGenerator(state)
          pagesDir.push({
            type: 'file',
            name:
              stateKey === states.default ? `index.js` : `${stateKey.toLowerCase()}.js`,
            content: {
              code: compiledComponent.code,
            },
          })

          allDependencies = {
            ...allDependencies,
            ...compiledComponent.dependencies,
          }
        }
      } catch (err) {
        console.error(componentKey, err)
      }
    } else {
      try {
        console.log('comp', comp)
        const compiledComponent = await componentGenerator(comp)
        compoenntsDir.push({
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
  }

  return { fileTree: { pagesDir, compoenntsDir }, allDependencies }
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

  const filesInComponents = fileTree.compoenntsDir
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
  uidlInput: componentWithStates,
  inputPath: boilerpaltePath,
  distPath: distGeneratorPath,
}).catch((err) => console.error(err))
