// tslint:disable:no-console
import chalk from 'chalk'
import inquirer from 'inquirer'

import path from 'path'

import componentWithStates from '../../inputs/component-states'

import { configureRouterAsemblyLine } from './pipeline/react-router-app'
import { configureAsemlyLine, ReactComponentFlavors } from './pipeline/react-component'

import {
  tsEnumToArray,
  copyDirRec,
  removeDir,
  writeTextFile,
  mkdir,
  readJSON,
} from './utils'

const componentGenerator = configureAsemlyLine({
  variation: ReactComponentFlavors.JSS,
})

const routingComponentGenerator = configureRouterAsemblyLine()

const processProjectUIDL = async (jsDoc: any) => {
  // pick root name/id

  const { components, root } = jsDoc
  const keys = Object.keys(components)

  const srcDir: any = []

  const compoenntsDir: any = []
  let allDependencies = {}
  // tslint:disable-next-line:forin
  for (const i in keys) {
    const key = keys[i]
    if (components[key].name === root) {
      try {
        const compiledComponent = await routingComponentGenerator(components[key])
        console.log(compiledComponent.code)
        srcDir.push({
          type: 'file',
          name: `index.js`,
          content: {
            code: compiledComponent.code,
          },
        })

        allDependencies = {
          ...allDependencies,
          ...compiledComponent.dependencies,
        }
      } catch (err) {
        console.error(key, err)
      }
    } else {
      try {
        const compiledComponent = await componentGenerator(components[key])
        compoenntsDir.push({
          type: 'file',
          name: `${components[key].name}.js`,
          content: compiledComponent,
        })

        console.log(compiledComponent)

        allDependencies = {
          ...allDependencies,
          ...compiledComponent.dependencies,
        }
      } catch (err) {
        console.error(key, err)
      }
    }
  }

  return { fileTree: { srcDir, compoenntsDir }, allDependencies }
}

interface GeneratorInputParams {
  inputPath: string
  distPath: string
  uidlInput: any
}

const init = () => {
  console.log(chalk.green('Generating React Project'))
}

const pickOptions = () => {
  Object.keys(ReactComponentFlavors).forEach((v) => {
    console.log(v, typeof v, Number(v))
  })
  const questions = [
    // {
    //   name: "FILENAME",
    //   type: "input",
    //   message: "What is the name of the file without extension?"
    // },
    {
      type: 'list',
      name: 'CSSFLAVOR',
      message: 'What css flavor do you want?',
      choices: tsEnumToArray(ReactComponentFlavors),
    },
  ]
  return inquirer.prompt(questions)
}

const run = async (params: GeneratorInputParams) => {
  const { inputPath, distPath, uidlInput } = params
  init()
  const options = await pickOptions()
  console.log(options)
  await removeDir(distPath)
  await copyDirRec(inputPath, distPath)

  const { fileTree, allDependencies } = await processProjectUIDL(uidlInput)

  const filesInSrc = fileTree.srcDir
  const srcFilesLength = filesInSrc.length

  let fileInfo

  for (let i = 0; i < srcFilesLength; i++) {
    fileInfo = filesInSrc[i]
    await writeTextFile(`${distPath}/src`, fileInfo.name, fileInfo.content.code)
  }

  const filesInComponents = fileTree.compoenntsDir
  const componentsFilesLength = filesInComponents.length

  await mkdir(`${distPath}/src/components`)

  for (let i = 0; i < componentsFilesLength; i++) {
    fileInfo = filesInComponents[i]
    await writeTextFile(
      `${distPath}/src/components`,
      fileInfo.name,
      fileInfo.content.code
    )
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
